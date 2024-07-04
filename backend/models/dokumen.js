'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class dokumen extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  dokumen.init({
    fileName: DataTypes.STRING,
    expiredDate: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'dokumen',
  });
  return dokumen;
};