import React from 'react'
import { useEffect, useState } from 'react'
import 'bulma/css/bulma.min.css';
 
import Modal from 'react-modal';
import './App.css'
import fileImage from './assets/file.png';


Modal.setAppElement('#root');

function App() {

  //get files data from server
  const [files, setFiles] = useState([{}]);

  useEffect(() => {
    fetch("/api/files").then(
      response => response.json()
    ).then(
      data => {
        setFiles(data)
      }
    )
  }, [])
  //get files data from server


  //download files from server
  const handleDownload = async () => {
     var fileName = document.querySelector('#download-Modal2').getAttribute('name')
    await fetch(`/api/downloadFile/${fileName}`)
      .then(response => {
        if (!response.ok) {
          alert('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        alert('There was a problem with the fetch operation:', error);
      });
  };
  //download files from server

  //Modal function
  const [selectedfile, setFile] = useState([]);

  const ShowModal1Clicked = () => {
    document.getElementById("upload-Modal1").classList.add("is-active")
  }
  const colseModal1Clicked = () => {
    document.getElementById("upload-Modal1").classList.remove("is-active")
  }

  const ShowModal2Clicked = (filename) => {
    document.getElementById("download-Modal2").classList.add("is-active");
    document.querySelector('#download-Modal2').setAttribute('name', filename);
    // document.getElementById("download-Modal2").name.add(filename);
  }
  const colseModal2Clicked = () => {
    document.getElementById("download-Modal2").classList.remove("is-active")
  }

  const selectFile = () => {
    const fileInput = document.querySelector('#file-js-example input[type=file]');

    fileInput.onchange = () => {
      if (fileInput.files.length > 0) {
        const fileName = document.querySelector('#file-js-example .file-name');
        fileName.textContent = fileInput.files[0].name;
        console.log("selected file: " + fileInput.files[0].name);
        setFile(fileInput.files[0]);
      }
    }
  }

  const handleSubmit = async () => {
    if (selectedfile != null) {
      const formData = new FormData();
      formData.append('file', selectedfile);
      await fetch("/api/upload", {
        method: 'POST',
        body: formData,
      })
        .then((res) => {
          if (res.status === 200) {
            alert("File uploaded"); colseModal1Clicked();
          }
          else if (res.status === 401) {
            alert("File already exist");
          }
          else {
            alert("Server Error");
          }
        })
        .catch((err) => ("Error occured", err));
      // colseModalClicked();
    }
  };
  //Modal function

  return (
    <body>
      <div display="flex-container is-mobile">
        <section class="hero is-small is-dark " >
          <div class="hero-body">
            <nav class="navbar" role="navigation" aria-label="main navigation">
              <div id="navbarBasicExample" class="navbar-menu">
                <div class="navbar-start">
                  <p class="title flex-item is-mobile" >File Management System</p>
                </div>
              </div>
            </nav>

          </div>
        </section>
      </div>

      <div class='pt-2 px-2 is-fluid'>
        <div class='column'>
          <div class="buttons is-right">
            <div class="field has-addons">
              <div class="control">
                <input class="input" type="text" placeholder="Find" />
              </div>
              <div class="control">
                <a class="button is-info" href="/">
                  Search
                </a>
              </div>
              <button class="button is-dark js-modal-trigger" data-target="upload-Modal"
                onClick={ShowModal1Clicked}>Upload file</button>
              <button class="button is-light">Create Folder</button>
            </div>

          </div>
        </div>

        <nav class="breadcrumb" aria-label="breadcrumbs">
          <ul>

            <li><a href="/">Root</a></li>
            <li><a href="/"></a></li>
            {/* <li><a href="/">Documentation</a></li>
            <li><a href="/">Components</a></li>
            <li class="is-active"><a href="/" aria-current="page">Breadcrumb</a></li> */}
          </ul>
        </nav>

        <div class=' container '>
          <div class=' columns is-multiline '>
            {(typeof files === 'undefined') ? (
              <p>Loading ...</p>
            ) : (
              files.map((file, i) => (
                <div key={i} class="column is-one-quarter has-text-centered is-clickable">
                  <img src={fileImage} alt="File image" class="is-centered"  onClick={()=>ShowModal2Clicked(file.name)}/>
                  <p class="title is-6 ">{file.name}</p>
                </div>
              )
              )
            )}
          </div>
        </div>

        <div id="upload-Modal1" class="modal">
          <div class="modal-background"></div>
          <div class="modal-card">
            <header class="modal-card-head">
              <p class="modal-card-title">Upload file</p>
              <button class="delete" aria-label="close" onClick={colseModal1Clicked}></button>
            </header>
            <section class="modal-card-body">
              {/* <!-- Content ... --> */}
              <p >Click to select a file</p>

              <div id="file-js-example" class="file has-name">
                <label class="file-label">
                  <input class="file-input" type="file" name="resume" onClick={selectFile} />
                  <span class="file-cta" >
                    <span class="file-icon">
                      <i class="fas fa-upload"></i>
                    </span>
                    <span class="file-label" >
                      Choose a file…
                    </span>
                  </span>
                  <span class="file-name">
                    No file uploaded
                  </span>
                </label>
              </div>
            </section>
            <footer class="modal-card-foot">
              <button class="button is-success" onClick={handleSubmit}>submit</button>
              <button class="button" onClick={colseModal1Clicked}>Cancel</button>
            </footer>
          </div>
        </div>

        <div id="download-Modal2" class="modal">
          <div class="modal-background"></div>
          <div class="modal-card">
            <header class="modal-card-head">
              <p class="modal-card-title">Download file</p>
              <button class="delete" aria-label="close" onClick={colseModal2Clicked}></button>
            </header>
            <section class="modal-card-body">
              {/* <!-- Content ... --> */}
              <p >Select your download method</p>
              <div id="file-js-example" class="file has-name">
                <label class="file-label">
                  {/* <input class="file-input" type="file" name="resume" onClick={selectFile} /> */}
                  <span class="file-cta" >
                    {/* <span class="file-icon">
                      <i class="fas fa-upload"></i>
                    </span> */}
                     {/* ()=>handleDownload(file.name) */}
                    <span class="file-label" onClick={()=>handleDownload()}>
                      download directly
                    </span>
                  </span>
                  
                </label>
              </div>
            </section>
            <footer class="modal-card-foot">
              {/* <button class="button is-success" onClick={handleSubmit}>submit</button> */}
              <button class="button" onClick={colseModal2Clicked}>Cancel</button>
            </footer>
          </div>
        </div>

      </div>

    </body >

  )
}


export default App
