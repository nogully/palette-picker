const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.use(bodyParser.json());
app.set('port', process.env.PORT || 3000); 

app.use(express.static('public'));

app.locals.title = 'swatches';

app.use('*',( req ,res, next) => {
  if(req.headers['x-forwarded-proto']!='https' && environment === 'production'){
    res.redirect('https://swatch-saver.herokuapp.com'+req.url)
  }
  else {
    next()
  } 
})

app.get('/api/v1/palettes', (req, res) => {
  database('palettes').select()
    .then(palettes => {
      res.status(200).json(palettes);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
})

app.get('/api/v1/palettes/:id', (req, res) => {
  database('palettes').where('id', req.params.id).select()
    .then(palette => {
      if (palette.length) {
        res.status(200).json(palette)
      } else {
        res.status(404).json({
          error: `Could not find palette with id ${req.params.id}`
        })
      }
    })
    .catch(error => {
      res.status(500).json({ error });
    });
})

app.post('/api/v1/palettes', (request, response) => {
  const userRequest = request.body;
  for (let requiredParameter of ['name', 'colors', 'project_id']) {
    if (!userRequest[requiredParameter]) {
      return response
        .status(422)
        .send({ error: `Expected format: { name: <String>, colors: <Array>, project_id: <Number> }. You're missing a "${requiredParameter}" property.` });
    }
  }
  const { name, colors, project_id } = userRequest;
  const palette = { name, 
                    project_id, 
                    color1: colors[0],
                    color2: colors[1], 
                    color3: colors[2], 
                    color4: colors[3], 
                    color5: colors[4]
                    };
  database('palettes').insert(palette, 'id')
    .then(paletteArray => {
      response.status(201).json({name, project_id, colors, id: paletteArray[0]})
    })
    .catch(error => {
      response.status(500).json({ error });
    })
})

app.delete('/api/v1/palettes/:id', (request, response) => {
  database('palettes').where('id', request.params.id).del()
    .then(id => {
      if (id) {
        response.status(202).json({ id })
      } else {
        response.status(404).json({
          error: `Could not find palette with id ${request.params.id}`
        })
      }
    })
    .catch(error => {
      response.status(500).json({ error });
    })
})

app.get('/api/v1/projects', (req, res) => {
  database('projects').select()
    .then(projects => {
      res.status(200).json(projects);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
})

app.get('/api/v1/projects/:id/palettes', (req, res) => {
  database('palettes').where('project_id', req.params.id).select()
    .then(palettes => {
      if (palettes.length) {
        res.status(200).json(palettes);
      } else {
        res.status(404).json({ 
          error: `Could not find palettes for a project_id ${req.params.id}`
        });
      }
    })
    .catch(error => {
      res.status(500).json({ error });
    });
})

app.post('/api/v1/projects', (request, response) => {
  const project = request.body;
  if (!project.name) {
    return response
      .status(422)
      .send({ error: `Expected format: { name: <String> }. You're missing a name.` });
  }
  database('projects').insert(project, 'id')
    .then(projectArray => {
      response.status(201).json({ name: project.name, id: projectArray[0] })
    })
    .catch(error => {
      response.status(500).json({ error });
    })
    
});

app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} server running on port ${app.get('port')}`)
});

module.exports = app;