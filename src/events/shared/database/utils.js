// const { formatWithCursor } = require("prettier");
const { Utils, DataTypes, literal } = require("sequelize");
const { randomString } = require("../utils");

/**
 * Define model.
 * @param {any} sequelize
 * @param {String} modelName
 * @param {any} fields
 * @param {any} options
 * @returns {any}
 */
const model = function (sequelize, modelName, fields, options = {}) {
    const tableName = Utils.underscoredIf(modelName, true);
    const newFields = {
        id: {
            field: "id",
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            _autoGenerated: true,
        },
        ...fields,
    };

    const env = process.env.NODE_ENV || "development";
    const { charset, collate } = require("../database/configs")[env].define;

    Object.keys(newFields).forEach((key) => {
        if (newFields[key].type == DataTypes.STRING) {
            newFields[key].type += ` CHARSET ${charset} COLLATE ${collate}`;
        }
    });

    const newOptions = {
        charset: "utf8",
        collate: "utf8_unicode_ci",
        tableName: tableName,
        timestamps: true,
        paranoid: true,
        underscoredAll: true,
        underscored: true,
        ...options,
    };

    Object.keys(newFields).forEach(function (key) {
        newFields[key].underscored = true;
        newFields[key].field = newFields[key].field || Utils.underscoredIf(key, true);
    });

    return sequelize.define(modelName, newFields, newOptions);
};

/**
 * Create table using migration.
 * @param {any} queryInterface
 * @param {String | { name: String, start?: Number }} tableInfo
 * @param {any} fields
 * @param {any} options
 * @returns {Promise<any>}
 */
const migration = function (queryInterface, tableInfo, fields, options = {}) {
    let tableName = "";
    let autoIncrementStart = 1;

    if ("string" == typeof tableInfo) {
        tableName = Utils.underscoredIf(tableInfo, true);
    } else if (tableInfo.name) {
        tableName = Utils.underscoredIf(tableInfo.name, true);

        autoIncrementStart = parseInt(tableInfo.start || 1);
        if ("number" != typeof autoIncrementStart) {
            autoIncrementStart = 1;
        }
    } else {
        throw new Error(
            `Please specify table model name, table info: ${JSON.stringify(tableInfo)}`
        );
    }

    const newFields = {
        id: {
            field: "id",
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        ...fields,
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    };

    Object.keys(newFields).forEach(function (key) {
        newFields[key].underscored = true;
        newFields[key].field = newFields[key].field || Utils.underscoredIf(key, true);

        if (newFields[key].references) {
            if (newFields[key].references.model) {
                newFields[key].references.model = Utils.underscoredIf(
                    newFields[key].references.model,
                    true
                );
            }

            if (newFields[key].references.key) {
                newFields[key].references.key = Utils.underscoredIf(
                    newFields[key].references.key,
                    true
                );
            }
        }
    });

    return queryInterface.createTable(tableName, newFields, options).then(function () {
        const query = `ALTER TABLE ${tableName} AUTO_INCREMENT = ${autoIncrementStart}`;
        return queryInterface.sequelize.query(query);
    });
};

/**
 * Drop table.
 * @param {any} queryInterface
 * @param {String} modelName
 * @returns {Promise<any>}
 */
const drop = function (queryInterface, modelName) {
    const tableName = Utils.underscoredIf(modelName, true);
    return queryInterface.dropTable(tableName);
};

/**
 * Add columns into table.
 * @param {any} queryInterface
 * @param {String} modelName
 * @param {any} columns
 * @returns {Promise<any>}
 */
const addColumns = function (queryInterface, modelName, columns) {
    const tableName = Utils.underscoredIf(modelName, true);
    const promises = columns.map(function (column) {
        const fieldName = Utils.underscoredIf(column.field, true);

        column.after = Utils.underscoredIf(column.after, true);

        if (column.references && column.references.model) {
            column.references.model = Utils.underscoredIf(column.references.model, true);
        }
        return queryInterface.addColumn(tableName, fieldName, column);
    });

    return Promise.all(promises);
};

/**
 * Add column into table.
 * @param {any} queryInterface
 * @param {String} modelName
 * @param {any} column
 * @returns {Promise<any>}
 */
const addColumn = function (queryInterface, modelName, column) {
    const tableName = Utils.underscoredIf(modelName, true);
    const fieldName = Utils.underscoredIf(column.field, true);

    column.after = Utils.underscoredIf(column.after, true);
    if (column.references && column.references.model) {
        column.references.model = Utils.underscoredIf(column.references.model, true);
    }
    return queryInterface.addColumn(tableName, fieldName, column);
};

/**
 * Remove colums from table.
 * @param {any} queryInterface
 * @param {String} modelName
 * @param {string[]} columns
 * @returns {Promise<any>}
 */
const removeColumns = function (queryInterface, modelName, columns) {
    const tableName = Utils.underscoredIf(modelName, true);
    const promises = columns.map(function (column) {
        const columnName = Utils.underscoredIf(column, true);
        return queryInterface.removeColumn(tableName, columnName);
    });

    return Promise.all(promises);
};

/**
 * Add foreign key to columns.
 * @param {any} queryInterface
 * @param {String} modelName
 * @param {string[]} columns
 * @returns {Promise<any>}
 */
const addForeignKeys = function (queryInterface, modelName, columns) {
    const tableName = Utils.underscoredIf(modelName, true);
    const promises = columns.map(function (column) {
        const fieldName = Utils.underscoredIf(column.field, true);
        const referenceTableName = Utils.underscoredIf(column.model, true);
        const referenceFieldName = Utils.underscoredIf(column.reference || "id", true);

        if (column.after) {
            column.after = Utils.underscoredIf(column.after, true);
        }

        const constraintOptions = {
            type: "foreign key",
            references: {
                table: referenceTableName,
                field: referenceFieldName,
            },
        };

        if (`${modelName}_${fieldName}_${referenceTableName}_fk`.length > 50) {
            const rand = randomString(4, "n");
            constraintOptions.name = `${fieldName}_${referenceFieldName}_${rand}_fk`;
        }

        return queryInterface.addConstraint(tableName, [fieldName], constraintOptions);
    });

    return Promise.all(promises);
};

const changeColumns = function (queryInterface, modelName, columns) {
    const tableName = Utils.underscoredIf(modelName, true);
    const promises = Object.keys(columns).map(function (field) {
        const fieldName = Utils.underscoredIf(field, true);
        if (columns[field].references) {
            if (columns[field].references.model) {
                columns[field].references.model = Utils.underscoredIf(
                    columns[field].references.model,
                    true
                );
            }

            if (columns[field].references.key) {
                columns[field].references.key = Utils.underscoredIf(
                    columns[field].references.key,
                    true
                );
            }
        }

        return queryInterface.changeColumn(tableName, fieldName, columns[field]);
    });

    return Promise.all(promises);
};

const renameColumn = function (queryInterface, modelName, oldColumn, newColumn) {
    return queryInterface.renameColumn(
        Utils.underscoredIf(modelName, true),
        Utils.underscoredIf(oldColumn, true),
        Utils.underscoredIf(newColumn, true)
    );
};

/**
 * Add Unqiue index
 * @param {any} queryInterface
 * @param {String} modelName
 * @param {{field: string, indexName?: string}} column
 * @returns {Promise<any>}
 */
const addSingleUniqueIndex = function (queryInterface, modelName, column) {
    const tableName = Utils.underscoredIf(modelName, true);
    const fieldName = Utils.underscoredIf(column.field, true);

    let indexName = fieldName;
    if (column.indexName) {
        indexName = Utils.underscoredIf(column.indexName, true);
    }

    return queryInterface.addIndex(tableName, [fieldName], {
        name: indexName,
        unique: true,
    });
};

/**
 * Remove index
 * @param {any} queryInterface
 * @param {String} modelName
 * @param {string} column
 * @returns {Promise<any>}
 */
const removeIndex = function (queryInterface, modelName, column) {
    const tableName = Utils.underscoredIf(modelName, true);
    const fieldName = Utils.underscoredIf(column, true);

    return queryInterface.removeIndex(tableName, fieldName);
};

module.exports = {
    model,
    migration,
    drop,
    addColumns,
    addColumn,
    removeColumns,
    addForeignKeys,
    changeColumns,
    renameColumn,
    addSingleUniqueIndex,
    removeIndex,
};