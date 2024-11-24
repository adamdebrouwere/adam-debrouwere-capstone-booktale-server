/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async (knex) => {
  await knex('user_books').del();
  await knex('comments').del();
  await knex('qr_codes').del();
  await knex('books').del();
  await knex('users').del();

  await knex('users').insert([
    { username: 'john_doe', password: '1', email: 'john@example.com', first_name: 'John', last_name: 'Doe' },
    { username: 'jane_doe', password: 'hashedpassword2', email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' },
    { username: 'mark_smith', password: 'hashedpassword3', email: 'mark@example.com', first_name: 'Mark', last_name: 'Smith' }
  ]);

  await knex('books').insert([
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { title: '1984', author: 'George Orwell' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee' }
  ]);

  await knex('qr_codes').insert([
    { book_id: 1, qr_code_url: 'http://example.com/qr/1' },
    { book_id: 2, qr_code_url: 'http://example.com/qr/2' },
    { book_id: 3, qr_code_url: 'http://example.com/qr/3' }
  ]);

  await knex('comments').insert([
    { book_id: 1, user_id: 1, comment: 'A great classic novel.' },
    { book_id: 2, user_id: 2, comment: 'A dystopian masterpiece.' },
    { book_id: 3, user_id: 3, comment: 'A deeply emotional and important book.' }
  ]);

  await knex('user_books').insert([
    { user_id: 1, book_id: 1 },
    { user_id: 2, book_id: 2 },
    { user_id: 3, book_id: 3 }
  ]);
};
