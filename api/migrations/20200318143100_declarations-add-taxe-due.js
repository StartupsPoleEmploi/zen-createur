exports.up = async function(knex) {
  await knex.schema.table('declarations', table => {
    table.enum('taxeDue', ['monthly', 'quartely']).defaultTo(null);
  });
};

exports.down = async function(knex) {
  knex.schema.table('declarations', function(table) {
    table.dropColumn('taxeDue');
  });
};
