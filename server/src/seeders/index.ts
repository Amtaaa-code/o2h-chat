import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@o2h.com' },
    update: {},
    create: {
      email: 'admin@o2h.com',
      username: 'admin',
      password: adminPassword,
      avatar: null,
      role: 'ADMIN',
      profile: {
        create: { fullName: 'Admin O2H', phoneNumber: '+628123456789', gender: 'MALE' },
      },
      settings: { create: {} },
    },
  });

  // Create test users
  const userPassword = await bcrypt.hash('user123', 12);
  const users = [];
  const userData = [
    { email: 'john@example.com', username: 'john', fullName: 'John Doe', gender: 'MALE' },
    { email: 'jane@example.com', username: 'jane', fullName: 'Jane Smith', gender: 'FEMALE' },
    { email: 'mike@example.com', username: 'mike', fullName: 'Mike Johnson', gender: 'MALE' },
    { email: 'sarah@example.com', username: 'sarah', fullName: 'Sarah Williams', gender: 'FEMALE' },
    { email: 'alex@example.com', username: 'alex', fullName: 'Alex Brown', gender: 'MALE' },
    { email: 'emma@example.com', username: 'emma', fullName: 'Emma Davis', gender: 'FEMALE' },
    { email: 'david@example.com', username: 'david', fullName: 'David Wilson', gender: 'MALE' },
    { email: 'lisa@example.com', username: 'lisa', fullName: 'Lisa Anderson', gender: 'FEMALE' },
  ];

  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        username: u.username,
        password: userPassword,
        profile: {
          create: { fullName: u.fullName, gender: u.gender as any },
        },
        settings: { create: {} },
      },
    });
    users.push(user);
  }

  console.log(`✅ Created ${users.length + 1} users`);

  // Create contacts
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j) {
        await prisma.contact.upsert({
          where: { ownerId_targetId: { ownerId: users[i].id, targetId: users[j].id } },
          update: {},
          create: { ownerId: users[i].id, targetId: users[j].id },
        });
      }
    }
  }
  console.log('✅ Created contacts');

  // Create sample messages
  const chatTypes = ['PRIVATE', 'GROUP'] as const;
  const messageContents = [
    'Hey! How are you?',
    'I am doing great, thanks!',
    'Did you see the new update?',
    'Yes, it looks amazing!',
    'Let me know when you are free',
    'Sure, let us meet tomorrow',
    'Thanks for the help!',
    'No problem at all!',
    'See you later!',
    'Have a great day!',
  ];

  for (let i = 0; i < 20; i++) {
    const senderIdx = Math.floor(Math.random() * users.length);
    let receiverIdx = Math.floor(Math.random() * users.length);
    while (receiverIdx === senderIdx) receiverIdx = Math.floor(Math.random() * users.length);

    await prisma.message.create({
      data: {
        senderId: users[senderIdx].id,
        chatType: 'PRIVATE',
        chatId: String(users[receiverIdx].id),
        content: messageContents[Math.floor(Math.random() * messageContents.length)],
        type: 'TEXT',
      },
    });
  }
  console.log('✅ Created sample messages');

  // Create a group
  const group = await prisma.group.create({
    data: {
      name: 'O2H Team',
      description: 'O2H Development Team Chat',
      creatorId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          ...users.slice(0, 5).map((u) => ({ userId: u.id, role: 'MEMBER' as const })),
        ],
      },
    },
  });
  console.log('✅ Created group');

  // Create group messages
  for (let i = 0; i < 10; i++) {
    const senderIdx = Math.floor(Math.random() * (users.length - 1));
    await prisma.groupMessage.create({
      data: {
        groupId: group.id,
        senderId: users[senderIdx].id,
        content: messageContents[Math.floor(Math.random() * messageContents.length)],
        type: 'TEXT',
      },
    });
  }
  console.log('✅ Created group messages');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });