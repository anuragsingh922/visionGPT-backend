const express = require("express");
const fs = require('fs');
const path = require('path');

const delete_image = async (req, res) => {
  const {id} = req.body; // Assuming the search query is sent in the request body

  console.log("ID : ", id);

  try {

    if(fs.existsSync(path.join(__dirname , ".." , 'screenshots' , `${id}.jpg`))){
        fs.unlinkSync(path.join(__dirname , ".." , 'screenshots' , `${id}.jpg`));
      }
    res.status(200).send("Deleted.");
  } catch (error) {
    console.error("Error deleting file.", error);
    res.status(500).send("Error deleting file.");
  }
};

module.exports = { delete_image };
