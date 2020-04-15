exports.up = async function up(knex) {
  await knex.schema.table('declarations', (table) => {
    table.dropColumn('taxeDue');
  });
  await knex.schema.table('declarations', (table) => {
    table.enum('taxeDue', ['monthly', 'quaterly']).defaultTo(null);
  });
};

exports.down = async function down(knex) {
  await knex.schema.table('declarations', (table) => {
    table.dropColumn('taxeDue');
  });
  await knex.schema.table('declarations', (table) => {
    table.enum('taxeDue', ['monthly', 'quartely']).defaultTo(null);
  });
};
