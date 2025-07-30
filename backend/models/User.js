const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runAsync, getAsync, allAsync } = require('../database/db');

class User {
  static async getAll() {
    return await allAsync(
      'SELECT id, name, email, role, active, created_at, updated_at FROM users ORDER BY name'
    );
  }

  static async getById(id) {
    return await getAsync(
      'SELECT id, name, email, role, active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
  }

  static async getByEmail(email) {
    return await getAsync('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async create(data) {
    const { name, email, password, role = 'cashier' } = data;
    
    // Check if email already exists
    const existing = await this.getByEmail(email);
    if (existing) {
      throw new Error('El email ya está registrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await runAsync(
      `INSERT INTO users (name, email, password, role) 
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, role]
    );
    
    return this.getById(result.id);
  }

  static async update(id, data) {
    const { name, email, role, active } = data;
    
    await runAsync(
      `UPDATE users 
       SET name = ?, email = ?, role = ?, active = ?
       WHERE id = ?`,
      [name, email, role, active ? 1 : 0, id]
    );
    
    return this.getById(id);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await runAsync(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  }

  static async delete(id) {
    return await runAsync('DELETE FROM users WHERE id = ?', [id]);
  }

  static async login(email, password) {
    const user = await this.getByEmail(email);
    
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.active) {
      throw new Error('Usuario desactivado');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last login
    await runAsync(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await getAsync('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      throw new Error('Contraseña actual incorrecta');
    }

    await this.updatePassword(userId, newPassword);
  }

  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      const user = await this.getById(decoded.id);
      
      if (!user || !user.active) {
        throw new Error('Usuario no válido');
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}

module.exports = User;