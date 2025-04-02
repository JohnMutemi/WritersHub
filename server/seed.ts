import { storage } from './storage';
import { hashPassword } from './auth';

// Seed data function to create initial users for testing
export async function seedData() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    if (!existingAdmin) {
      try {
        // Create admin user
        const adminUser = await storage.createUser({
          username: 'admin',
          email: 'admin@sharpquill.com',
          password: await hashPassword('admin123'),
          role: 'admin',
          fullName: 'Admin User',
          bio: 'System Administrator',
          profileImage: null
        });
        
        // Update approval status after creation
        await storage.updateWriterApprovalStatus(adminUser.id, 'approved');
        console.log('Admin user created successfully');
      } catch (error) {
        console.error('Error creating admin user:', error);
      }
    }

    // Create a sample writer user
    const existingWriter = await storage.getUserByUsername('writer');
    if (!existingWriter) {
      try {
        const writerUser = await storage.createUser({
          username: 'writer',
          email: 'writer@sharpquill.com',
          password: await hashPassword('writer123'),
          role: 'writer',
          fullName: 'Sample Writer',
          bio: 'Experienced content writer specializing in technical documentation',
          profileImage: null
        });
        
        // Update approval status and add balance after creation
        await storage.updateWriterApprovalStatus(writerUser.id, 'approved');
        await storage.updateUserBalance(writerUser.id, 100);
        console.log('Writer user created successfully');
      } catch (error) {
        console.error('Error creating writer user:', error);
      }
    }

    // Create a sample client user
    const existingClient = await storage.getUserByUsername('client');
    if (!existingClient) {
      try {
        const clientUser = await storage.createUser({
          username: 'client',
          email: 'client@sharpquill.com',
          password: await hashPassword('client123'),
          role: 'client',
          fullName: 'Sample Client',
          bio: 'Business owner looking for quality content',
          profileImage: null
        });
        
        // Add balance after creation
        await storage.updateUserBalance(clientUser.id, 500);
        console.log('Client user created successfully');
      } catch (error) {
        console.error('Error creating client user:', error);
      }
    }

    console.log('Seed data creation completed');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}