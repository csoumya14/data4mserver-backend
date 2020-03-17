const express = require("express");
const app = express();
if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
require('dotenv').config()
const Note = require('./models/note');

const cors = require("cors");

app.use(cors());
app.use(express.json())
app.use(express.static("build"));

const bodyParser = require("body-parser");

app.use(bodyParser.json());

const requestLogger = (request, response, next) => {
  console.log("Method: ", request.method);
  console.log("Path: ", request.path);
  console.log("Body: ", request.body);
  console.log("---");
  next();
};

app.use(requestLogger);

app.get("/api/notes", (request, response) => {
  //response.json(notes);
  Note.find({}).then(notes => {
    response.json(notes.map(note => note.toJSON()));
  });
});

app.post("/api/notes", (request, response,next) => {
  const body = request.body;
  if (body.content === undefined) {
    return response.status(400).json({
      error: "content missing"
    });
  }

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date(),
  });

  note
    .save()
    .then(savedNote => savedNote.toJSON())
    .then(savedAndFormattedNote => {
      response.json(savedAndFormattedNote)
    })
    .catch(error => next(error))
});

app.get("/api/notes/:id", (request, response, next) => {
  Note.findById(request.params.id).then(note => {
    if(note){
      response.json(note.toJSON())
    } else {
      response.status(404).end()
    } 
  })
  .catch(error => next(error))
});

app.delete("/api/notes/:id", (request, response,next) => {
  Note.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error)) 
});

app.put('/api/notes/:id',(request,response,next) => {
  const body = request.body

  const note = {
    content: body.content,
    important: body.important,
  }

  Note.findByIdAndUpdate(request.params.id, note, {new: true})
    .then(updatedNote => {
      response.json(updatedNote.toJSON())
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const errorHandler = (error,request,response,next) => {
  console.error(error.message)

  if(error.name === 'CastError' && error.kind === 'ObjectId'){
    return response.status(400).send({error: 'malformatted id'})
  }else if (error.name === 'ValidationError'){
    return response.status(400).json({error: error.message})
  }

  next (error)
}

app.use(errorHandler)

const PORT = process.env.PORT 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
