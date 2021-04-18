
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const pass = require(__dirname + "/account.js");
const mongoose = require("mongoose");
const _ = require('lodash');

const app = express();
const password = pass.getPass();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-viktor:" + password + "@cluster0.wv8uo.mongodb.net/todolistDB", { useNewUrlParser: true,
   useFindAndModify: false, useUnifiedTopology: true });

const itemsSchema = {
  name: String
}
const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  // const day = date.getDate();
  Item.find(function(err, foundItems){
      res.render("list", {listTitle: "Today", newListItems: foundItems});
  })
});

app.post("/", function(req, res){
  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: item
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  };
});

app.post("/delete", function(req, res) {
  const itemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove({ _id: itemID }, function(err){
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  };
});

const defaultItems = [];

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
