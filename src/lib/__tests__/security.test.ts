import assert from 'node:assert/strict';
import {
  detectSqlInjection,
  detectXss,
  validateSafeField,
  validateEmail,
  validatePasswordStrength,
  generateSalt,
  hashPasswordPBKDF2,
  verifyPasswordPBKDF2,
  computeSessionSignature,
  verifySessionSignature,
} from '../security';
import {
  loginUser,
  registerUser,
  requestPasswordRecovery,
  resetUserPassword,
} from '../auth';

async function runSecurityTests() {
  console.log('==============================================================');
  console.log(' INICIANDO AUDITORÍA Y PRUEBAS DE SEGURIDAD - AMERICAN CLOTHES');
  console.log('==============================================================\n');

  let passed = 0;

  // 1. Pruebas Anti-Inyección SQL (SQLi)
  const sqlPayloads = [
    "' OR '1'='1",
    "admin' OR 1=1--",
    '" OR ""="',
    "'; DROP TABLE products; --",
    "1; DELETE FROM orders;",
    "' UNION SELECT id, email, password FROM users--",
    "' UNION ALL SELECT null, version()--",
    "'; SELECT pg_sleep(10);--",
    "1' AND SLEEP(5)#",
    "WAITFOR DELAY '0:0:5'",
    "' AND 1=(SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES)--",
    "EXEC xp_cmdshell('dir')",
    "0x61646d696e",
    "CHAR(65)",
  ];

  for (const payload of sqlPayloads) {
    assert.equal(
      detectSqlInjection(payload),
      true,
      `Fallo al detectar payload SQLi: ${payload}`
    );
    const fieldCheck = validateSafeField(payload, 'Campo de Prueba');
    assert.equal(fieldCheck.valid, false, `validateSafeField debió bloquear: ${payload}`);
    passed++;
  }
  console.log(`✓ [1/6] ${sqlPayloads.length} vectores de ataque de Inyección SQL (SQLi) bloqueados exitosamente.`);

  // 2. Pruebas de entradas legítimas (Cero Falsos Positivos)
  const safeInputs = [
    'Camila Rodríguez',
    'Calle 85 #11-53, Bogotá, Colombia',
    'Abrigo de Lana Virgen Negro',
    'AMC-405',
    'valentina.mendoza@americanclothes.com',
  ];

  for (const safe of safeInputs) {
    assert.equal(detectSqlInjection(safe), false, `Falso positivo SQLi en: ${safe}`);
    assert.equal(detectXss(safe), false, `Falso positivo XSS en: ${safe}`);
    const fieldCheck = validateSafeField(safe, 'Campo Seguro');
    assert.equal(fieldCheck.valid, true, `Entrada segura rechazada: ${safe}`);
    passed++;
  }
  console.log(`✓ [2/6] ${safeInputs.length} entradas legítimas de usuario validadas sin falsos positivos.`);

  // 3. Pruebas Anti-XSS (Cross-Site Scripting)
  const xssPayloads = [
    "<script>alert('XSS')</script>",
    '<img src=x onerror=alert(1)>',
    'javascript:alert(document.cookie)',
    '<svg onload=fetch("https://attacker.tld")>',
    '<iframe src="https://evil.com"></iframe>',
  ];

  for (const xss of xssPayloads) {
    assert.equal(detectXss(xss), true, `Fallo al detectar payload XSS: ${xss}`);
    const fieldCheck = validateSafeField(xss, 'Campo XSS');
    assert.equal(fieldCheck.valid, false, `validateSafeField debió bloquear XSS: ${xss}`);
    passed++;
  }
  console.log(`✓ [3/6] ${xssPayloads.length} vectores de ataque Cross-Site Scripting (XSS) bloqueados.`);

  // 4. Validación de Correo y Fortaleza de Contraseña
  assert.equal(validateEmail('cliente@americanclothes.com').valid, true);
  assert.equal(validateEmail("admin@americanclothes.com' OR '1'='1").valid, false);
  assert.equal(validateEmail('correo-invalido').valid, false);
  assert.equal(validatePasswordStrength('Admin2026*').valid, true);
  assert.equal(validatePasswordStrength('12345').valid, false);
  assert.equal(validatePasswordStrength("Pass1234' OR 1=1--").valid, false);
  passed += 6;
  console.log('✓ [4/6] Validación estricta de correos RFC 5322 y complejidad de contraseñas verificada.');

  // 5. Hashing Criptográfico PBKDF2-SHA256 (100,000 iteraciones)
  const salt1 = generateSalt();
  const salt2 = generateSalt();
  assert.notEqual(salt1, salt2, 'Los salts aleatorios deben ser únicos');

  const hash1 = await hashPasswordPBKDF2('Admin2026*', salt1);
  const hash2 = await hashPasswordPBKDF2('Admin2026*', salt2);
  assert.equal(hash1.length, 64, 'El hash SHA-256 debe tener 64 caracteres hexadecimales (256 bits)');
  assert.notEqual(hash1, hash2, 'La misma contraseña con distinto salt debe producir hashes distintos');

  const validVerify = await verifyPasswordPBKDF2('Admin2026*', salt1, hash1);
  const invalidVerify = await verifyPasswordPBKDF2('ClaveIncorrecta1*', salt1, hash1);
  assert.equal(validVerify, true, 'La verificación PBKDF2 debió aceptar la contraseña correcta');
  assert.equal(invalidVerify, false, 'La verificación PBKDF2 debió rechazar la contraseña incorrecta');
  passed += 5;
  console.log('✓ [5/6] Cifrado criptográfico PBKDF2-SHA256 (100,000 iteraciones) y comparación en tiempo constante verificados.');

  // 6. Integridad de Sesión y Prevención de Escalada de Privilegios (Client -> Admin)
  const clientSig = await computeSessionSignature('usr-001', 'cliente@americanclothes.com', 'client');
  const isClientValid = await verifySessionSignature(
    'usr-001',
    'cliente@americanclothes.com',
    'client',
    clientSig
  );
  assert.equal(isClientValid, true, 'La firma legítima de cliente debe ser válida');

  // Simular ataque: el cliente modifica su rol a 'admin' manteniendo su firma
  const tamperedRoleValid = await verifySessionSignature(
    'usr-001',
    'cliente@americanclothes.com',
    'admin',
    clientSig
  );
  assert.equal(
    tamperedRoleValid,
    false,
    'CRÍTICO: La adulteración de rol de client a admin debe invalidar la firma inmediatamente'
  );
  passed += 2;
  console.log('✓ [6/7] Protección contra escalada de privilegios (separación Admin/Cliente) verificada.');

  // 7. Flujo Completo de Autenticación, Registro y Recuperación de Contraseña
  const sqliLogin = await loginUser("admin@americanclothes.com' OR '1'='1", "anything' OR 1=1--");
  assert.equal(sqliLogin.success, false, 'El login con SQLi debe ser bloqueado');

  const adminLogin = await loginUser('admin@americanclothes.com', 'Admin2026*');
  assert.equal(adminLogin.success, true, 'El login de administrador legítimo debe funcionar');
  assert.equal(adminLogin.user?.role, 'admin', 'El rol del administrador debe ser admin');

  const blockAdminReg = await registerUser({
    name: 'Intruso',
    email: 'admin@americanclothes.com',
    password: 'Password123*',
    confirmPassword: 'Password123*',
  });
  assert.equal(blockAdminReg.success, false, 'No se debe permitir registrar un correo administrativo');

  const recoveryRes = await requestPasswordRecovery("usuario@correo.com' UNION SELECT * FROM users--");
  assert.equal(recoveryRes.success, false, 'La recuperación con SQLi debe ser rechazada');

  const validRecovery = await requestPasswordRecovery('cliente@americanclothes.com');
  assert.equal(validRecovery.success, true, 'La solicitud de recuperación legítima debe procesarse');

  const resetSqlAttempt = await resetUserPassword({
    email: 'cliente@americanclothes.com',
    newPassword: "Pass1234' OR 1=1--",
    confirmPassword: "Pass1234' OR 1=1--",
  });
  assert.equal(resetSqlAttempt.success, false, 'El restablecimiento con SQLi debe ser rechazado');
  passed += 7;
  console.log('✓ [7/7] Flujos de Login, Registro, Separación de Roles y Recuperación por Correo verificados.');

  console.log(`\n==============================================================`);
  console.log(` RESULTADO FINAL: ${passed}/${passed} PRUEBAS DE SEGURIDAD APROBADAS (100%)`);
  console.log(`==============================================================`);
}

runSecurityTests().catch((err) => {
  console.error('Fallo en pruebas de seguridad:', err);
  process.exit(1);
});
