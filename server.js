const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'students.json');

// Helper function to ensure students.json exists
function ensureDataFileExists() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
}

const server = http.createServer((req, res) => {
    ensureDataFileExists();

    // 1. Home Route / Form View
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Student Record Form</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 50px; background: #f4f4f9; }
                    .container { max-width: 400px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    h2 { color: #333; }
                    .form-group { margin-bottom: 15px; }
                    label { display: block; margin-bottom: 5px; font-weight: bold; }
                    input { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
                    button { background: #28a745; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; width: 100%; font-size: 16px; }
                    button:hover { background: #218838; }
                    .link { display: block; margin-top: 15px; text-align: center; text-decoration: none; color: #007bff; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Student Record Form</h2>
                    <form action="/submit" method="POST">
                        <div class="form-group">
                            <label>Student Name:</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>Roll Number:</label>
                            <input type="text" name="rollNumber" required>
                        </div>
                        <div class="form-group">
                            <label>Course:</label>
                            <input type="text" name="course" required>
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" name="email" required>
                        </div>
                        <button type="submit">Add Student button</button>
                    </form>
                    <a class="link" href="/students">View Student Records (/students)</a>
                </div>
            </body>
            </html>
        `);
    } 
    // 2. Handle Form Submission & Store Data in students.json
    else if (req.method === 'POST' && req.url === '/submit') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const parsedData = new URLSearchParams(body);
            const newStudent = {
                name: parsedData.get('name'),
                rollNumber: parsedData.get('rollNumber'),
                course: parsedData.get('course'),
                email: parsedData.get('email'),
                createdAt: new Date().toISOString()
            };

            // Read existing records, append new record, and write back
            fs.readFile(DATA_FILE, 'utf8', (err, data) => {
                let students = [];
                if (!err && data) {
                    try {
                        students = JSON.parse(data);
                    } catch (e) {
                        students = [];
                    }
                }

                students.push(newStudent);

                fs.writeFile(DATA_FILE, JSON.stringify(students, null, 2), (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Server Error: Could not save data.');
                        return;
                    }

                    // Redirect back or show success message with link to view students
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <div style="font-family: Arial; text-align: center; margin-top: 50px;">
                            <h3 style="color: green;">Student record added successfully!</h3>
                            <a href="/" style="margin-right: 15px;">Add Another Student</a>
                            <a href="/students">View All Students</a>
                        </div>
                    `);
                });
            });
        });
    } 
    // 3. Display Student Records Route (/students)
    else if (req.method === 'GET' && req.url === '/students') {
        fs.readFile(DATA_FILE, 'utf8', (err, data) => {
            let students = [];
            if (!err && data) {
                try {
                    students = JSON.parse(data);
                } catch (e) {
                    students = [];
                }
            }

            let rows = students.map((s, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${s.name}</td>
                    <td>${s.rollNumber}</td>
                    <td>${s.course}</td>
                    <td>${s.email}</td>
                </tr>
            `).join('');

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Student Records</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 50px; background: #f4f4f9; }
                        .container { max-width: 700px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                        h2 { color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background-color: #007bff; color: white; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .back-btn { display: inline-block; margin-top: 15px; text-decoration: none; color: #007bff; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Registered Student Records</h2>
                        ${students.length === 0 ? '<p>No student records found.</p>' : `
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Roll Number</th>
                                        <th>Course</th>
                                        <th>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        `}
                        <br>
                        <a class="back-btn" href="/">&larr; Back to Form</a>
                    </div>
                </body>
                </html>
            `);
        });
    } 
    // 4. 404 Not Found
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server is running and opened on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser.`);
});