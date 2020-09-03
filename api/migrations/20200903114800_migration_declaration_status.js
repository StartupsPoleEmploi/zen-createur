/* eslint-disable */
exports.up = function(knex) {
	return knex.raw(
		`UPDATE declaration_revenues dr
    SET "status" = d."status"
    FROM "declarations" d
    WHERE dr."declarationId" = d."id"
    AND dr."status" IS NULL`
	);
};

exports.down = function(knex) {};
