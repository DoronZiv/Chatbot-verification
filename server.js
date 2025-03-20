const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Files will be stored in "uploads" folder

app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json());

app.post('/uploadfile', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.json({ message: `File uploaded: ${req.file.originalname}` });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
