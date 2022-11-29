import mongoose from "mongoose"  //import from node-module folder

const mongoURI =
  "mongodb://127.0.0.1:27017/my_test_DB?readPreference=primary&appname=Shopify_app%20Compass&directConnection=true&ssl=false";
//connection string
const connectToMongo = () => {
  //for connect to database
  mongoose.connect(mongoURI, () => {
    //function (call back)

    console.log("Connected to Mongo Sucessfully");
  });
};

export default connectToMongo; //export the connectToMongo
