const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser=require("cookie-parser");
const app = express();
require('dotenv').config()
const port = process.env.PORT || 3000;

// middle wares
app.use(cors({
  origin:[
    "http://localhost:5173",
    "https://job-portal-9bb40.web.app",
    "https://job-portal-9bb40.firebaseapp.com",
    ],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken =(req,res,next) =>{
  const token = req.cookies.token;
  if(!token){
    return res.status(401).send({message:"forbidden access"})
  }
  jwt.verify(token,process.env.JWT_SECRET,(err,decoded) =>{
    if(err){
      return res.status(401).send({message:"forbidden access"})
    }
    req.user=decoded
    next()
  })
}

app.get("/", (req,res) =>{
    res.send("find your career goal")
})

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hojma.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const jobsCollection = client.db("CareerQuest").collection("jobs");
    const jobApplicationCollection = client.db("CareerQuest").collection("job_applications");
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Auth related APIs
    app.post("/jwt", async(req,res) =>{
     const user = req.body;
     const token = jwt.sign({data:user},process.env.JWT_SECRET,{expiresIn:"3h"})
     res
     .cookie("token", token,{
      httpOnly:true,
      secure:false,
      sameSite:"strict"
     })
     .send({success:true})
    })

    app.post("/logout", async(req,res) =>{
      res.clearCookie("token",{
        httpOnly:true,
        secure:false,
        sameSite:"strict",
        maxAge:36000,
      })
      .send({logout: true})
    })
    // jobs related APIs

    app.get("/jobs", async(req,res) => {
      const email = req.query.email;
      let query ={};
      if(email){
        query={hr_email:email}
      }
        const cursor = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    });
    app.get("/jobs/:id", async(req,res)=> {
        const id = req.params.id;
        const cursor = {_id: new ObjectId(id)};
        const result = await jobsCollection.findOne(cursor);
        res.send(result);
    })

    app.post("/jobs", async(req,res) =>{
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    })

    // job applications apis 

    app.get("/job-applications",verifyToken, async (req,res) => {
      const email = req.query.email;
      const query = {applicant_email: email};
     if(req?.user?.data?.email !== req.query.email){
      return res.status(403).send({message:"forbidden access"});
     }
      // if(req?.user?.data?.email !== req.query.email){
      //   return res.status(403).send({message:"Forbidden access"})
      // }
        const result = await jobApplicationCollection.find(query).toArray();

        for(const application of result){
         const query1 = {_id :new ObjectId(application.job_id)}
         const job = await jobsCollection.findOne(query1);
         if(job){
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
          application.location = job.location;
          application.category = job.category;
          application.jobType = job.jobType;
         }
        }

        res.send(result);
    })

    app.get("/job-applications/jobs/:job_id", async (req,res) =>{
      const jobId = req.params.job_id;
      const query = {job_id: jobId};
      const result = await jobApplicationCollection.find(query).toArray();
      for(const application of result){
        const id = application.job_id;
        const query = {_id : new ObjectId(id)}
        const job = await jobsCollection.findOne(query);
        if(job){
          application.title = job.title;
        } 
      }
      res.send(result);
    })

    app.post("/job-applications", async (req,res) =>{
      const applicationData = req.body;
      const result =await jobApplicationCollection.insertOne(applicationData);
      const id = applicationData.job_id;
      const query = {_id: new ObjectId(id)};
      const job = await jobsCollection.findOne(query);
      let newCount = 0;
      if(job.applicationCount){
        newCount= job.applicationCount + 1;
      }
      else{
        newCount = 1;
      }
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set:{
          applicationCount: newCount
        }
      }
      const updateResult = await jobsCollection.updateOne(filter,updatedDoc)
      res.send(result);
    })

    app.patch("/job-applications/:id", async(req,res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const data = req.body;
      const updatedDoc = {
        $set:{
          status: data.status
        }
      }
      const result = await jobApplicationCollection.updateOne(filter,updatedDoc);
      res.send(result);
    })

    app.delete("/job-applications/:id", async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await jobApplicationCollection.deleteOne(query);
      res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () =>{
    console.log(`your server side is running port is ${port}`)
})