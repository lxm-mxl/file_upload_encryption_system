import React from 'react'
import { useEffect, useState, useRef } from 'react'
import 'bulma/css/bulma.min.css';

import Modal from 'react-modal';
import './App.css'
import fileImage from './assets/file.png';

import CryptoJS from 'crypto-js';
import { AES, enc } from 'crypto-js';
import { saveAs } from 'file-saver';
import JSEncrypt from 'jsencrypt'


Modal.setAppElement('#root');

function App() {

  //get files data from server
  const [files, setFiles] = useState([{}]);
  const inputENCPassphrase = useRef(null);
  const inputPublicKey = useRef(null)
  const inputDECPassphrase = useRef(null);
  const inputPrivateKey = useRef(null)

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



  //Modal function
  const [file, setFile] = useState();

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


  const handleDirectSubmit = async () => {
    if (file != null) {
      console.log(file)
      const formData = new FormData();
      formData.append('file', file);
      await fetch("/api/upload", {
        method: 'POST',
        body: formData,
      })
        .then((res) => {
          if (res.status === 200) {
            alert("File uploaded");
            colseModal1Clicked();
            window.location.reload();
          }
          else if (res.status === 401) {
            alert("File already exist");
          }
          else {
            alert("Server Error");
          }
        })
        .catch((err) => ("Error occured" + err));
    }
    else {
      alert("no file selected")
    }
  };

  function encryptFileWithPassPhrase(file, passphrase) {
    console.log(file.type.split("/"))
    const type = file.type.split("/");
    const secretKey = CryptoJS.enc.Utf8.parse(passphrase)

    return new Promise((resolve, reject) => {
      if (type[0] === 'image') {
        const fileReader = new FileReader();
        fileReader.onload = function (event) {
          const fileData = event.target.result.split(',')[1];
          console.log("original: " + fileData, toString())
          const encryptedData = CryptoJS.AES.encrypt(fileData, secretKey, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          }).toString();

          console.log("encrypted: " + encryptedData)
          const encryptedBlob = new Blob([encryptedData], { type: file.type });
          const encryptedFile = new File([encryptedBlob], file.name, { type: file.type });
          resolve(encryptedFile);
        };
        fileReader.onerror = function (event) {
          reject(event.target.error);
        };
        // fileReader.readAsBinaryString(file);
        fileReader.readAsDataURL(file);
      }
      else {
        const fileReader = new FileReader();
        fileReader.onload = function (event) {
          const fileData = event.target.result;
          const encryptedData = CryptoJS.AES.encrypt(fileData, passphrase);
          const encryptedBlob = new Blob([encryptedData], { type: file.type });
          const encryptedFile = new File([encryptedBlob], file.name, { type: file.type });
          resolve(encryptedFile);
        };
        fileReader.onerror = function (event) {
          reject(event.target.error);
        };
        // fileReader.readAsBinaryString(file);
        fileReader.readAsBinaryString(file);
      }

    });
  }

  const encryptFileWithPublicKey = (publicKeyStr, file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (event) {
        const fileData = event.target.result
        const key = "-----BEGIN PUBLIC KEY-----" + publicKeyStr + "-----END PUBLIC KEY-----";
        var encryptor = new JSEncrypt()
        encryptor.setPublicKey(key)
        const rsaDta = encryptor.encrypt(fileData);
        const returnFile = new File([rsaDta], file.name, { type: file.type })

        resolve(returnFile);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  };



  const handlePublicKeySubmit = async () => {
    const publicKey = inputPublicKey.current.value;
    if (publicKey === null || publicKey === "") { alert("no public key inputted"); return; } else { console.log("public key", publicKey) }
    if (file == null) { alert("no file selected"); return; }

    try {
      encryptFileWithPublicKey(publicKey, file)
        .then(ciphertext => {
          const formData = new FormData();
          formData.append('file', ciphertext);
          fetch("/api/upload", {
            method: 'POST',
            body: formData,
          })
            .then((res) => {
              if (res.status === 200) {
                alert("File encrypted with Public key uploaded");
                colseModal1Clicked();
                window.location.reload();
              }
              else if (res.status === 401) {
                alert("File already exist");
              }
              else {
                alert("Server Error");
              }
            })
            .catch((err) => ("Error occured" + err));
        })
    } catch (error) { alert(error) }


  }

  const handlePassPhraseSubmit = async () => {
    const EncPassPhrase = inputENCPassphrase.current.value;
    if (EncPassPhrase === null || EncPassPhrase === "") { alert("no passphrase inputted"); return; } else { console.log("passphrase", EncPassPhrase) }
    if (file == null) { alert("no file selected"); return; }


    //handle file encryption
    encryptFileWithPassPhrase(file, EncPassPhrase).then(encryptedData => {
      // Upload the encrypted data to the server
      const formData = new FormData();
      formData.append('file', encryptedData);
      fetch("/api/upload", {
        method: 'POST',
        body: formData,
      })
        .then((res) => {
          if (res.status === 200) {
            alert("File encrypted with passphrase uploaded");
            colseModal1Clicked();
            window.location.reload();
          }
          else if (res.status === 401) {
            alert("File already exist");
          }
          else {
            alert("Server Error");
          }
        })
        .catch((err) => ("Error occured" + err));
    });
  }

  //download files directly from server
  const handleDirectDownload = async () => {
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
  //download files directly from server

  const decryptImageBlob = (encryptedBlob, key) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const encryptedData = event.target.result;
        const decryptedData = CryptoJS.AES.decrypt(encryptedData, key);
        const decryptedBinaryString = decryptedData.toString(CryptoJS.enc.Base64);
        // const mimeType = decryptedData.salt.toString(CryptoJS.enc.Utf8);
        const decodedData = atob(decryptedBinaryString);
        const arrayBuffer = new ArrayBuffer(decodedData.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < decodedData.length; i++) {
          uint8Array[i] = decodedData.charCodeAt(i);
        }

        const blob = new Blob([arrayBuffer], { type: encryptedBlob.type });
        resolve(blob);
      };

      reader.onerror = (event) => {
        reject(event.target.error);
      };

      reader.readAsText(encryptedBlob);
    });
  };
  //download files and decrypt by passphrase
  const handleDownloadAndDecryptWithPassphrase = async () => {
    try {
      const decPassPhrase = inputDECPassphrase.current.value;
      const secretKey = CryptoJS.enc.Utf8.parse(decPassPhrase)

      if (decPassPhrase === "" || decPassPhrase === null) {
        alert("No passphrase inputted");
        return;
      }

      const fileName = document.querySelector('#download-Modal2').getAttribute('name');
      await fetch(`/api/downloadFile/${fileName}`)
        .then(response => {
          if (!response.ok) {
            alert('No file founded.');
          }
          return response.blob();
        })
        .then(blob => {
          console.log("original blob: " + blob.toString())

          if (blob.type.split('/')[0] === "image") {
            const reader = new FileReader();
            var decryptedData = null;
            reader.onload = () => {
              const encryptedData = reader.result;
              console.log(encryptedData)
              const encryptedBlob = new Blob([blob], { type: blob.type });

              decryptImageBlob(encryptedBlob, decPassPhrase)
                .then((decryptedBlob) => {
                  // const decryptedUrl = URL.createObjectURL(decryptedBlob);
                  const thisblob = new Blob([decryptedBlob], { type: decryptedBlob.type });
                  const url = window.URL.createObjectURL(thisblob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                })
                .catch((error) => {
                  console.error(error);
                });

            };
            reader.readAsText(blob);
          } else if (blob.type.split('/')[1] === "pdf") {
            const reader = new FileReader();
            var decryptedData = null;
            reader.onload = () => {
              const encryptedData = reader.result;
              console.log(encryptedData)

              // const base64Str = CryptoJS.enc.Base64.stringify(cipherParams);
              decryptedData = CryptoJS.AES.decrypt(encryptedData, secretKey, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
              });

              let decryptedStr = decryptedData.toString(CryptoJS.enc.Binary);

              console.log("decrypted: " + decryptedStr)

              const thisblob = new Blob([decryptedStr], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(thisblob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            };
            reader.readAsDataURL(blob);
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              const encryptedData = reader.result;
              console.log(encryptedData)
              var decryptedData = null;

              decryptedData = CryptoJS.AES.decrypt(encryptedData, decPassPhrase).toString(CryptoJS.enc.Utf8)

              const decryptedDataStr = decryptedData.toString(CryptoJS.enc.Utf8);
              console.log("decrypted: " + decryptedDataStr)

              const thisblob = new Blob([decryptedData], { type: blob.type });
              const url = window.URL.createObjectURL(thisblob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            };
            reader.readAsBinaryString(blob);
          }

        })
    } catch (error) {
      alert(`There was a problem with the fetch operation: ${error}`);
    }
  };

  const decryptFileWithPrivateKey = (privateKeyStr, file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (event) {
        const fileData = event.target.result
        const key = "-----BEGIN PRIVATE KEY-----" + privateKeyStr + "-----END PRIVATE KEY-----";
        var encryptor = new JSEncrypt()
        encryptor.setPrivateKey(key)
        const rsaDta = encryptor.decrypt(fileData);
        const returnBlob = new Blob([rsaDta], { type: file.type })

        resolve(returnBlob);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsArrayBuffer(file);
    });
  };
  //download files and decrypt by private key
  const handleDownloadAndDecryptWithPrivateKey = async () => {
    const privateKey = inputPrivateKey.current.value
    if (privateKey === "" || privateKey === null) {
      alert("No private key inputted");
      return;
    }
    const fileName = document.querySelector('#download-Modal2').getAttribute('name');

    await fetch(`/api/downloadFile/${fileName}`)
      .then(response => {
        if (!response.ok) {
          alert('No file founded.');
        }
        return response.blob();
      })
      .then(blob => {
  
        const key = "-----BEGIN PRIVATE KEY-----" + privateKey + "-----END PRIVATE KEY-----";
        var encryptor = new JSEncrypt()
        encryptor.setPrivateKey(key)
        const rsaDta = encryptor.decrypt(blob);
        const thisblob = new File([rsaDta], fileName,{ type: blob.type });

        const url = window.URL.createObjectURL(thisblob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        

      })
  };

  async function generatePublickeyPairFile() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: { name: 'SHA-256' },
      },
      true,
      ['encrypt', 'decrypt']
    );

    const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    var publicKeyText = RSA2text(publicKey);
    var privateKeyText = RSA2text(privateKey, 1);

    const thisblob = new Blob([publicKeyText, '\n', privateKeyText], { type: "text/plain" });
    const url = window.URL.createObjectURL(thisblob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "keys.pem";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  function RSA2text(buffer, isPrivate = 0) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    var base64 = window.btoa(binary);
    var text = "-----BEGIN " + (isPrivate ? "PRIVATE" : "PUBLIC") + " KEY-----\n";
    text += base64.replace(/[^\x00-\xff]/g, "$&\x01").replace(/.{64}\x01?/g, "$&\n");
    text += "\n-----END " + (isPrivate ? "PRIVATE" : "PUBLIC") + " KEY-----";
    return text;
  }

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
              {/* <div class="control">
                <input class="input" type="text" placeholder="Find" />
              </div>
              <div class="control">
                <a class="button is-info" href="/">
                  Search
                </a>
              </div> */}
              <button class="button is-dark js-modal-trigger" data-target="upload-Modal"
                onClick={ShowModal1Clicked}>Upload file</button>
              <button class="button is-light" onClick={generatePublickeyPairFile}>Generate Public Key</button>
            </div>

          </div>
        </div>

        <nav class="breadcrumb" aria-label="breadcrumbs">
          <ul>

            <li><a href="/">Root</a></li>
            {/* <li><a href="/"></a></li> */}
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
                  <img src={fileImage} alt="File-pic" class="is-centered" onClick={() => ShowModal2Clicked(file.name)} />
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
              <br></br>
              <button class="button is-success" onClick={handleDirectSubmit}>submit directly</button>

              <br></br>
              <br></br>
              <p>Upload file with encryption</p>

              <div class="field has-addons">
                <div class="column">
                  <input id='passphrase_field' class="input" type="text" placeholder="Passphrase" ref={inputENCPassphrase} />
                </div>
                <div class="column">
                  <button class="button is-info" onClick={handlePassPhraseSubmit}>
                    submit with Passphrase encryption
                  </button>
                </div>
              </div>


              <div class="field has-addons">
                <div class="column">
                  <input id='publickey_field' class="input" type="text" placeholder="Public key" ref={inputPublicKey} />
                </div>

                <div class="column">
                  <button class="button is-info" onClick={handlePublicKeySubmit}>
                    submit with Public key encryption
                  </button>
                </div>
              </div>

            </section>
            <footer class="modal-card-foot">
              {/* <button class="button is-success" onClick={handleSubmit}>submit</button> */}
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
                  <span class="file-cta" >
                    <span class="file-label" onClick={() => handleDirectDownload()}>
                      download directly
                    </span>
                  </span>
                </label>
              </div>

              <div class="field has-addons">
                <div class="column">
                  <input id='passphrase_field' class="input" type="text" placeholder="Passphrase" ref={inputDECPassphrase} />
                </div>
                <div class="column">
                  <button class="button is-info" onClick={handleDownloadAndDecryptWithPassphrase}>
                    download and decrypt with Passphrase
                  </button>
                </div>
              </div>

              <div class="field has-addons">
                <div class="column">
                  <input id='passphrase_field' class="input" type="text" placeholder="Passphrase" ref={inputPrivateKey} />
                </div>
                <div class="column">
                  <button class="button is-info" onClick={handleDownloadAndDecryptWithPrivateKey}>
                    download and decrypt with Private key
                  </button>
                </div>
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
