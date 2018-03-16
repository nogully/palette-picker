const express = require('express'); //brings in the express library
const app = express(); //creates an instance of the express() object and all of its methods
const bodyParser = require('body-parser'); //brings in the body-parser library

const environment = process.env.NODE_ENV || 'development'; 
//sets the environment to either the NODE_ENV environmental variable (provided by heroku) or to devlopment
const configuration = require('./knexfile')[environment];
//hands the environment to the knexfile, that will use either test, development or environment for its config
const database = require('knex')(configuration);
//creates a different postgres database dependent on env config (2 lines above)

app.use(bodyParser.json()); //uses body-parser library as middleware to parse the body of request objects that are json
app.set('port', process.env.PORT || 3000); 
//sets the port to either the environmental variable 'PORT' (provided by heroku) or to 3000

app.use(express.static('public')); //for the static elements served up by express, points it to the /public directory

app.locals.title = 'swatches'; //sets a local variable called 'title' to reference below when running the server in development

app.get('/api/v1/palettes', (req, res) => { //sets up an endpoint (a url), that when requested via fetch's 'GET' method, executes a callback function with parameters (user) 'request' and (server) 'response'
  database('palettes').select()             //connects to the postgres database 'palettes' table and selects all the rows by default
    .then(palettes => {                     //takes all those rows and delivers them as an array of information (a Promise)
      res.status(200).json(palettes);       //sends back a response with status code 200 as well as a json object containing
    })                                      //all the rows from the database as discrete objects in an array
    .catch((error) => {                     //if there is a server-side error it will be caught
      res.status(500).json({ error });      //upon error, an http status of 500 will be sent along with an object with 
    });                                     //key: error and value: error message
})

app.get('/api/v1/palettes/:id', (req, res) => {             //sets up a dynamic endpoint (a url), that when requested via fetch's 'GET' method (with an 'id' param)
  database('palettes').where('id', req.params.id).select()  //connects to the postgres database 'palettes' table and selects the row for that primary key of 'id'
    .then(palette => {                                      //returns a Promise with an array containing the object that has unique 'id'
      if (palette.length) {                                 //if there was an object with that 'id'
        res.status(200).json(palette)                       //returns a response object with http status 200 and a json version of the array
      } else {
        res.status(404).json({                              //otherwise an http status of 404 is sent along with a specific error message
          error: `Could not find palette with id ${req.params.id}` 
        })                                                  //in the body of a json object, it will tell them that no palette exists with that 'id'
      }
    })
    .catch(error => {                                       //if there is a server-side error it will be caught
      res.status(500).json({ error });                      //upon error, an http status of 500 will be sent along with an object with 
    });                                                     //key: error and value: error message
})

app.post('/api/v1/palettes', (request, response) => {       //sets up an endpoint (a url), that when a user sends a request object with method 'POST',
  const userRequest = request.body;                         //declares a variable for the user's request object
  for (let requiredParameter of ['name', 'colors', 'project_id']) { //simple for loop that goes through an array of possible params 
    if (!userRequest[requiredParameter]) {                  //if the user request object is missing a parameter
      return response                                       //sends a response with http status 422 (unprocessable) and a helpful error message
        .status(422)                                        //that tells the user what format it likes its request object to have
        .send({ error: `Expected format: { name: <String>, colors: <Array>, project_id: <Number> }. You're missing a "${requiredParameter}" property.` });
    }                                                       //and that they are missing a specific parameter
  }
  const { name, colors, project_id } = userRequest;         //destructures the userRequest object
  const palette = { name,                                   //creates a palette object for the database with the user's parameters
                    project_id,   
                    color1: colors[0],                      //user submits an array and the database has the colors listed as columns
                    color2: colors[1], 
                    color3: colors[2], 
                    color4: colors[3], 
                    color5: colors[4]
                    };
  database('palettes').insert(palette, 'id')                //inserts the palette object into the 'palettes' table of the database 
    .then(paletteArray => {                                 //and will return a Promise with the primary key 'id' assigned by the database in an array
      response.status(201).json({name, project_id, colors, id: paletteArray[0]}) //sends a response object with status 201 (created) and an object containing
    })                                                      //name, project_id, colors array, and the new 'id' assigned by the database
    .catch(error => {                               //if there is a server-side error it will be caught
      response.status(500).json({ error });         //upon error, an http status of 500 will be sent along with an object with
    })                                              //key: error and value: error message
})

app.delete('/api/v1/palettes/:id', (request, response) => { //sets up a dynamic endpoint (a url), that when requested via fetch's 'DELETE' method (with an 'id' param)
  database('palettes').where('id', request.params.id).del() //connects to the postgres database 'palettes' table and deletes the row with that 'id'
    .then(id => {                                           //returns a Promise using that returned id in the callback
      if (id) {                                             //if an id is returned
        response.status(202).json({ id })                   //returns a response object with status 202 (deleted) and the 'id' as a json object
      } else {                                              //if there was no 'id' returned from the database
        response.status(404).json({                         //returns a response object with status 404 (not found) and a helpful json object
          error: `Could not find palette with id ${request.params.id}` //with a helpful message saying that no palette was found for that 'id'
        })
      }
    })
    .catch(error => {                               //if there is a server-side error it will be caught
      response.status(500).json({ error });         //upon error, an http status of 500 will be sent along with an object with
    })                                              //key: error and value: error message
})

app.get('/api/v1/projects', (req, res) => {         //sets up an endpoint (a url), that when requested via fetch's 'GET' method,
  database('projects').select()                     //connects to the postgres database 'projects' table and selects all the rows by default
    .then(projects => {                             //returns a Promise with array of those projects as an argument
      res.status(200).json(projects);               //sends a response object with status 200 (ok) and that array of projects in json format
    })
    .catch((error) => {                             //if there is a server-side error it will be caught
      res.status(500).json({ error });              //upon error, an http status of 500 will be sent along with an object with
    });                                             //key: error and value: error message
})  

app.get('/api/v1/projects/:id/palettes', (req, res) => {  //sets up a dynamic endpoint (a url), that when requested via fetch's 'GET' method (with an 'id' param)
  database('palettes').where('project_id', req.params.id).select() //selects all the palettes that have that foreign key of 'id'
    .then(palettes => {                             //sends back an array of palettes that have that project_id
      if (palettes.length) {                        //if the array has length
        res.status(200).json(palettes);             //sends a response object with status 200 (ok) and that array of palettes in json format
      } else {
        res.status(404).json({                      //otherwise returns a response object with status 404 (not found) and a helpful json object
          error: `Could not find palettes for a project_id ${req.params.id}` //telling you what's wrong
        });
      }
    })
    .catch(error => {                           //if there is a server-side error it will be caught
      res.status(500).json({ error });          //upon error, an http status of 500 will be sent along with an object with
    });                                         //key: error and value: error message
})

app.post('/api/v1/projects', (request, response) => { //sets up an endpoint (a url), that when a user sends a request object with method 'POST',
  const project = request.body;                 //declares a variable for the user's request object
  if (!project.name) {                          //if it doesn't have a name
    return response                             //sends a helpful message with status 422 telling you what's wrong
      .status(422)
      .send({ error: `Expected format: { name: <String> }. You're missing a name.` });
  }
  database('projects').insert(project, 'id')
    .then(projectArray => {
      response.status(201).json({ name: project.name, id: projectArray[0] })
    })
    .catch(error => {                          //if there is a server-side error it will be caught
      response.status(500).json({ error });    //upon error, an http status of 500 will be sent along with an object with
    })                                         //key: error and value: error message
    
});

app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} server running on port ${app.get('port')}`)
});

module.exports = app;