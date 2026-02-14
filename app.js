const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/hello', (req, res) => {
  res.send('你好，这是我的第一个 GitOps 项目！！！！！\n');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
