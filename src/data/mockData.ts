import { Product, Order } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Bolso Tote de Obsidiana',
    sku: 'AES-001',
    price: 3560000,
    stock: 24,
    category: 'Accesorios',
    status: 'ACTIVO',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDe8JFelISU8TiNUjGi_bscGbRRuZpQiYRbbmzoOXJGdEweGYCQsVwHdSkmR5m0X9qGyvvjN6MOPPCBsB61M1Uscn_4bwQ_XZsK5eKqjyfEZTo3op4zYnD5RRjkzwS35Cp9SwUaJi2lXSYL8Yotxim3wDveH8LLeMT1q3pYSEepnYqECKV766_obVtzw5ToXAI4JHqAHH94pM3_xOG-gb8Z6UzG0z0nfm_jypx5-3YEGCLGdXxdqfPr',
    description: 'Bolso tote esculpido en piel de becerro obsidian con acabado mate artesanal, herrajes de titanio oscurecido y un compartimento interno de terciopelo técnico.',
    sizes: ['Única'],
    featured: true,
  },
  {
    id: '2',
    name: 'Anillo de Oro Aura',
    sku: 'AES-042',
    price: 1800000,
    stock: 3,
    category: 'Accesorios',
    status: 'STOCK BAJO',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfjyvqYWns8yuitOFcLQg4EOoNjXzMOlwHJtmeaHETi8aTxE0MOqoGKCFWEbbJWLvIXlnSNX6yqf_I-zH1PmuKQBjDdH3EUKZnzmORgqaIOJx3sj4bYADv5UlqrJgJtJaNf1Utwfw74dyi7hDymcYUpCe4WwQGA6Z1g1ULo7_38AHSj5OY8gqHLO7IE-wJ3TGz29ZWXiBsBtpCIAMQ4ZJKdmy4AyYv7oJi-mOf2P9I8A9tMriawFZw',
    description: 'Anillo minimalista fundido en oro de 18 quilates con textura orgánica sobre piedra de pizarra esculpida. Diseñado para un ajuste ergonómico atemporal.',
    sizes: ['S (16mm)', 'M (18mm)', 'L (20mm)'],
    featured: true,
  },
  {
    id: '3',
    name: 'Popelina Estructurada',
    sku: 'AES-112',
    price: 1280000,
    stock: 45,
    category: 'Hombre',
    status: 'PAUSADO',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn173ZrO-KE0yIlZzVUpcu5TcJYgiFmesKV_WPLnqQ5kOgdnn_-TdCUGdoqYJoA2IPwdobVgZNminUQYzhjGz6K4VmZGslyzmWqaAX9EbWaCRqwEscLTMG1DNcJ_rqHcqNpcCs5QdHXR8nwvfWjwU8kU0r2_RDCOU_yVqM8SIYqgk-CuUHagN7kYPe2Bq_YcpQs8er9i8qd-ANrX8EWQX-x1D1vu1f1MakRo8G_NVOf4sEBnhlBNbv',
    description: 'Camisa de popelín de algodón egipcio de corte sobredimensionado y arquitectura limpia, pliegues ocultos y botones de nácar pulido.',
    sizes: ['S', 'M', 'L', 'XL'],
    featured: false,
  },
  {
    id: '4',
    name: 'Gabardina de Terciopelo Esmeralda',
    sku: 'AES-088',
    price: 5800000,
    stock: 8,
    category: 'Mujer',
    status: 'ACTIVO',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBekPNiB5SekzdQRdiuovgz8pw1jYbD0CkGbxz7kTlcNr033nWxGrQsEGuZ_MwIuHQ1lUksfHCPPh_E5zJV4os7tu6JnUioJdwM--0I4lIalIhbDoZYQAWaapUDzAcuIPy9ODUj5-aIjS6TKgEleRQ346kWDVcoLgyUGX7NI_VWiZ-1hlOMPMNFTJ-Bm5c5VjMHkDMD6nXKj942WWdOaIKGRyY7oc9csADkVsyT1HlXTK4atN6qUxAD',
    description: 'Abrigo trench de terciopelo de seda en tono verde esmeralda profundo con bordados tonales delicados y solapa drapeada clásica.',
    sizes: ['XS', 'S', 'M', 'L'],
    featured: true,
  },
  {
    id: '5',
    name: 'Parka Táctica Urbana',
    sku: 'AES-204',
    price: 5120000,
    stock: 12,
    category: 'Hombre',
    status: 'ACTIVO',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWEcEanj9Y0-mkFZ8DJ-XD0kyCVvOl2EreiIYDNT77nGjL_p15Ana9-FtpOXOI8KI67CLzIgAck9qByYynfn98WOu2TKDEosTURJjHh87VhSowp3fyfpYt51pegR2zDnlpHFllAYeQJ87gNsnIV_YlYy9pUmbuxUifkb-_rax9p0jG04ZVwbpR--HFRRX_PvctfpbIWlQ5vGOOzkPvKl6_8fnLQn6RswtmDHnXjh4Flg74I0_qoEWj',
    description: 'Parka técnica multicapa de inspiración militar avant-garde, confeccionada con tejido repelente al agua, paneles desmontables y pasamontañas de lana técnica.',
    sizes: ['M', 'L', 'XL'],
    featured: true,
  },
  {
    id: '6',
    name: 'Colgante de Rubí Imperial',
    sku: 'AES-019',
    price: 8400000,
    stock: 2,
    category: 'Accesorios',
    status: 'STOCK BAJO',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSeU26lRHqYN8xOs4-6k8cy2ZxtfMgVGR4FjOyfXyD-IEZ3927JD79l8sTRzqyx_-X8wRoqNk_h2-u8WHdW2nAQCVeL3dmpec5xgdIDc2XgKjWjpOFTwFOEWmh9UgsLqoAmBKDeXAmhoo-KOacfysRind9dpbiRAZ1tNwECHjjKOJKFgtlKiL8jTfROFuqD-HKfe7CfP3__rDvMcgiuEsriZRUbbCMS49N6QINdehfmmZzspsr3NLE',
    description: 'Colgante de rubí corte cojín engarzado en marco de oro amarillo de 24K con cadena de eslabones gruesos bordada en hilos de oro noble.',
    sizes: ['Única'],
    featured: true,
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: '#ORD-9021',
    customerName: 'Valentina Arango',
    email: 'valentina.arango@email.com',
    timeAgo: 'Hace 10 min',
    date: '2026-08-08 19:11',
    total: 1800000,
    status: 'PROCESANDO',
    shippingAddress: 'Calle 85 #11-53, Bogotá',
    items: [
      {
        productId: '2',
        name: 'Anillo de Oro Aura',
        price: 1800000,
        quantity: 1,
        size: 'M (18mm)',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfjyvqYWns8yuitOFcLQg4EOoNjXzMOlwHJtmeaHETi8aTxE0MOqoGKCFWEbbJWLvIXlnSNX6yqf_I-zH1PmuKQBjDdH3EUKZnzmORgqaIOJx3sj4bYADv5UlqrJgJtJaNf1Utwfw74dyi7hDymcYUpCe4WwQGA6Z1g1ULo7_38AHSj5OY8gqHLO7IE-wJ3TGz29ZWXiBsBtpCIAMQ4ZJKdmy4AyYv7oJi-mOf2P9I8A9tMriawFZw'
      }
    ]
  },
  {
    id: '#ORD-9020',
    customerName: 'Santiago Mejía',
    email: 'santiago.mejia@email.com',
    timeAgo: 'Hace 45 min',
    date: '2026-08-08 18:36',
    total: 4840000,
    status: 'ENVIADO',
    shippingAddress: 'Carrera 43A #1-50, Medellín',
    items: [
      {
        productId: '1',
        name: 'Bolso Tote de Obsidiana',
        price: 3560000,
        quantity: 1,
        size: 'Única',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDe8JFelISU8TiNUjGi_bscGbRRuZpQiYRbbmzoOXJGdEweGYCQsVwHdSkmR5m0X9qGyvvjN6MOPPCBsB61M1Uscn_4bwQ_XZsK5eKqjyfEZTo3op4zYnD5RRjkzwS35Cp9SwUaJi2lXSYL8Yotxim3wDveH8LLeMT1q3pYSEepnYqECKV766_obVtzw5ToXAI4JHqAHH94pM3_xOG-gb8Z6UzG0z0nfm_jypx5-3YEGCLGdXxdqfPr'
      },
      {
        productId: '3',
        name: 'Popelina Estructurada',
        price: 1280000,
        quantity: 1,
        size: 'L',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn173ZrO-KE0yIlZzVUpcu5TcJYgiFmesKV_WPLnqQ5kOgdnn_-TdCUGdoqYJoA2IPwdobVgZNminUQYzhjGz6K4VmZGslyzmWqaAX9EbWaCRqwEscLTMG1DNcJ_rqHcqNpcCs5QdHXR8nwvfWjwU8kU0r2_RDCOU_yVqM8SIYqgk-CuUHagN7kYPe2Bq_YcpQs8er9i8qd-ANrX8EWQX-x1D1vu1f1MakRo8G_NVOf4sEBnhlBNbv'
      }
    ]
  },
  {
    id: '#ORD-9019',
    customerName: 'Mariana Gómez',
    email: 'mariana.gomez@email.com',
    timeAgo: 'Hace 2 horas',
    date: '2026-08-08 17:21',
    total: 3560000,
    status: 'ENVIADO',
    shippingAddress: 'Calle 122 #15-20, Bogotá',
    items: [
      {
        productId: '1',
        name: 'Bolso Tote de Obsidiana',
        price: 3560000,
        quantity: 1,
        size: 'Única',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDe8JFelISU8TiNUjGi_bscGbRRuZpQiYRbbmzoOXJGdEweGYCQsVwHdSkmR5m0X9qGyvvjN6MOPPCBsB61M1Uscn_4bwQ_XZsK5eKqjyfEZTo3op4zYnD5RRjkzwS35Cp9SwUaJi2lXSYL8Yotxim3wDveH8LLeMT1q3pYSEepnYqECKV766_obVtzw5ToXAI4JHqAHH94pM3_xOG-gb8Z6UzG0z0nfm_jypx5-3YEGCLGdXxdqfPr'
      }
    ]
  },
  {
    id: '#ORD-9018',
    customerName: 'Nicolás Restrepo',
    email: 'nicolas.restrepo@email.com',
    timeAgo: 'Hace 5 horas',
    date: '2026-08-08 14:15',
    total: 5800000,
    status: 'ENTREGADO',
    shippingAddress: 'Carrera 2 #11-68, Cartagena',
    items: [
      {
        productId: '4',
        name: 'Gabardina de Terciopelo Esmeralda',
        price: 5800000,
        quantity: 1,
        size: 'S',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBekPNiB5SekzdQRdiuovgz8pw1jYbD0CkGbxz7kTlcNr033nWxGrQsEGuZ_MwIuHQ1lUksfHCPPh_E5zJV4os7tu6JnUioJdwM--0I4lIalIhbDoZYQAWaapUDzAcuIPy9ODUj5-aIjS6TKgEleRQ346kWDVcoLgyUGX7NI_VWiZ-1hlOMPMNFTJ-Bm5c5VjMHkDMD6nXKj942WWdOaIKGRyY7oc9csADkVsyT1HlXTK4atN6qUxAD'
      }
    ]
  }
];

export const CHART_DATA_30D = [
  { day: '01', sales: 4800000 },
  { day: '03', sales: 7200000 },
  { day: '06', sales: 3600000 },
  { day: '09', sales: 9600000 },
  { day: '12', sales: 8400000 },
  { day: '15', sales: 6000000 },
  { day: '18', sales: 12400000 },
  { day: '21', sales: 13600000 },
  { day: '24', sales: 8000000 },
  { day: '27', sales: 11200000 },
];

export const CHART_DATA_90D = [
  { day: 'Mes 1', sales: 113600000 },
  { day: 'Mes 2', sales: 144800000 },
  { day: 'Mes 3', sales: 180920000 },
];
