/* eslint-disable */
exports.up = function(knex) {
  return knex.schema
    .hasTable('declaration_revenues')
    .then(exists => {
      if (exists) return Promise.reject({ done: true });
      return knex.schema.createTable('declaration_revenues', table => {
        table.increments('id').primary();
        table.integer('userId').notNullable();
        table.integer('declarationId').notNullable();
        table.integer('workHours');
        table.boolean('revenue').notNullable();
        table.boolean('hasEndedThisMonth');
        table.integer('documentId').notNullable();

        table.foreign('userId').references('Users.id');
        table.foreign('declarationId').references('declarations.id');
        table.index('userId');
        table.index('declarationId');
        table.unique(['userId', 'declarationId']);
      });
    })
    .catch(err => {
      if (err.done) return Promise.resolve();
      return Promise.reject(err);
    });
};

exports.down = function(knex, Promise) {};
