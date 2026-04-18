import { pool } from './db.js';

/**
 * Inisialisasi semua tabel database dalam urutan yang benar.
 * Tabel yang direferensikan (authors, categories, members) dibuat terlebih dahulu,
 * kemudian tabel yang bergantung padanya (books, loans, reviews).
 */
export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tabel authors
    await client.query(`
      CREATE TABLE IF NOT EXISTS authors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        nationality VARCHAR(100)
      )
    `);

    // 2. Tabel categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // 3. Tabel members
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        member_type VARCHAR(50) DEFAULT 'regular',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Tabel books (bergantung pada authors & categories)
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        isbn VARCHAR(20) UNIQUE,
        title VARCHAR(255) NOT NULL,
        author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1
      )
    `);

    // 5. Tabel loans (bergantung pada books & members)
    await client.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        loan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date DATE NOT NULL,
        returned_at TIMESTAMP
      )
    `);

    // 6. Tabel reviews — drop dulu jika ada constraint rusak, lalu buat ulang
    // Cek apakah tabel reviews ada tapi FK-nya bermasalah
    const reviewsExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reviews'
      )
    `);

    if (reviewsExist.rows[0].exists) {
      // Cek apakah FK constraint valid
      try {
        await client.query('SELECT book_id FROM reviews LIMIT 0');
      } catch {
        // Tabel ada tapi bermasalah, drop dan buat ulang
        await client.query('DROP TABLE IF EXISTS reviews CASCADE');
      }
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Semua tabel database berhasil diinisialisasi.');
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Jika masih gagal karena reviews, coba tanpa transaksi
    if (error.message.includes('reviews')) {
      console.log('⚠️ Mencoba perbaiki tabel reviews...');
      try {
        await client.query('DROP TABLE IF EXISTS reviews CASCADE');
        await client.query(`
          CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
            member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Tabel reviews berhasil diperbaiki.');
      } catch (retryErr) {
        console.error('❌ Gagal memperbaiki tabel reviews:', retryErr.message);
      }
    } else {
      console.error('❌ Gagal menginisialisasi database:', error.message);
      throw error;
    }
  } finally {
    client.release();
  }
}

