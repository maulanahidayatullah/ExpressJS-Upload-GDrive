const stream = require("stream");
const express = require("express");
const multer = require("multer");
const path = require("path");
const { google } = require("googleapis");
const app = express();
const upload = multer();
var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});


app.listen(5050, () => {
    console.log('Form running on port 5050');
});



const KEYFILEPATH = path.join(__dirname, "key.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});


app.post("/upload", async (req, res) => {
    try {
        const { body } = req;

        let img = body.img;
        const imgName = body.imgName;

        const fileExtension = cekExtension(img);

        if (fileExtension != 'jpg' && fileExtension != 'png') {
            return res.status(400).json({ message: "Invalid File Extension", statuscode: 400 });
        }

        // await uploadFile(img, imgName);
        const uploadedFile = await uploadFile(img, imgName);

        // console.log(`Uploaded file ${uploadedFile.name} with ID ${uploadedFile.id}`);
        return res.status(200).json({ message: "Success Uploaded", link: `https://drive.google.com/file/d/${uploadedFile.id}/view`, statuscode: 200 });
    } catch (f) {
        return res.status(500).send(f.message);
    }
});

const uploadFile = async (img, imgName) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(img, 'base64'));

    try {
        const { data } = await google.drive({ version: "v3", auth }).files.create({
            media: {
                // mimeType: "image/png",
                body: bufferStream,
            },
            requestBody: {
                name: imgName,
                // id Google Drive Folder
                parents: ["1jT1D0F8a5szyjqQdZMEluYeaju28ahx1"]
            },
            fields: "id,name",
        });

        return { id: data.id, name: data.name };
    } catch (error) {
        console.error('Error uploading file:', error.message);
        throw error;
    }
};

function cekExtension(base64String) {
    try {
        const decodedBase64 = atob(base64String);

        const slice = decodedBase64.slice(0, 4);

        let hex = '';
        for (let i = 0; i < slice.length; i++) {
            hex += ('00' + slice.charCodeAt(i).toString(16)).slice(-2);
        }

        let extension = '';
        switch (hex) {
            case '89504e47':
                extension = 'png';
                break;
            case 'ffd8ffe0':
            case 'ffd8ffe1':
            case 'ffd8ffe2':
                extension = 'jpg';
                break;
            case '47494638':
                extension = 'gif';
                break;
            case '25504446':
                extension = 'pdf';
                break;
            case '504b0304':
                extension = 'zip';
                break;
            case '504b0308':
                extension = 'xlsx';
                break;
            case '504b0309':
                extension = 'docx';
                break;
            default:
                extension = 'not defined';
                break;
        }

        return extension;
    } catch (error) {
        console.error('Error determining file extension:', error.message);
        return null;
    }
}

