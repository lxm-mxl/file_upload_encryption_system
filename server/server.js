const express = require('express')
const app = express()
const multer = require('multer');
var fs = require('fs');
const path = require('path');

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './fileUploads/')
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.originalname)
//     }
//   })

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './fileUploads/');
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const uploadPath = path.join(__dirname, './fileUploads/', file.originalname);
  
      if (fs.existsSync(uploadPath)) {
        let i = 1;
        while (fs.existsSync(path.join(__dirname, './fileUploads/', `${name}(${i})${ext}`))) {
          i++;
        }
        cb(null, `${name}(${i})${ext}`);
      } else {
        cb(null, file.originalname);
      }
    }
  });

const upload = multer({ storage : storage, limits: { fileSize: 1024 * 1024 * 10 } });

app.get("/api", (req,res)=>{
    res.json({
        "users":["usreOne","userTwo", "userThreee"]
    })
});


app.post("/api/upload", upload.single('file'), function(req, res, next){

    try{
        console.log("get file:"+(req.body != null))
        // if(req.body != null){
        //     console.log("file:", req.body)
        // }
       
        res.status(200).send('File uploaded successfully');
    }catch(err){
        console.log(err)
    }
   
});

app.get('/api/files', (req, res) => {
    const directoryPath = path.join(__dirname, './fileUploads/');
  
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      const fileNames = files.map(file => ({ name: file }));
  
      res.json(fileNames);
    });
  });

  app.get('/api/downloadFile/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = `./fileUploads/${fileName}`;
    res.download(filePath, fileName);
  });


app.listen(5000, ()=>{
    console.log("Server started on Port 5000");
});