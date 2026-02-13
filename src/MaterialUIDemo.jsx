import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Typography,
  Container,
  Grid,
  Paper,
  Chip,
  Alert,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Favorite,
  Share,
  Delete,
  Add,
  Check,
} from '@mui/icons-material';

function MaterialUIDemo() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Nombre: ${nombre}, Email: ${email}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Título Principal */}
      <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
        Demo de Material UI
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
        Componentes de ejemplo para tu proyecto SIGAD
      </Typography>

      <Grid container spacing={3}>
        {/* Sección de Alertas */}
        <Grid item xs={12}>
          <Stack spacing={2}>
            <Alert severity="success">
              ¡Material UI instalado correctamente! — Todo funciona bien.
            </Alert>
            <Alert severity="info">
              Este es un mensaje informativo — Prueba diferentes componentes.
            </Alert>
            <Alert severity="warning">
              Advertencia — No olvides instalar las dependencias primero.
            </Alert>
          </Stack>
        </Grid>

        {/* Card con formulario */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Formulario de Ejemplo
              </Typography>
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre completo"
                  variant="outlined"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Correo electrónico"
                  type="email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" type="submit" startIcon={<Check />}>
                    Enviar
                  </Button>
                  <Button variant="outlined" color="secondary">
                    Cancelar
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card con botones e iconos */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Botones e Iconos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Diferentes variantes de botones disponibles
              </Typography>
              
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button variant="contained" color="primary">
                    Primary
                  </Button>
                  <Button variant="contained" color="secondary">
                    Secondary
                  </Button>
                  <Button variant="contained" color="success">
                    Success
                  </Button>
                  <Button variant="contained" color="error">
                    Error
                  </Button>
                </Stack>

                <Divider />

                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" startIcon={<Add />}>
                    Agregar
                  </Button>
                  <Button variant="outlined" startIcon={<Delete />} color="error">
                    Eliminar
                  </Button>
                </Stack>

                <Divider />

                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Iconos individuales:
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton color="error">
                      <Favorite />
                    </IconButton>
                    <IconButton color="primary">
                      <Share />
                    </IconButton>
                    <IconButton color="warning">
                      <Delete />
                    </IconButton>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Chips y Tags */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Chips y Etiquetas
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip label="React" color="primary" />
              <Chip label="Vite" color="secondary" />
              <Chip label="Material UI" color="success" />
              <Chip label="JavaScript" color="warning" />
              <Chip label="Eliminar" color="error" onDelete={() => alert('Eliminado')} />
              <Chip label="Clickeable" onClick={() => alert('Click!')} />
            </Stack>
          </Paper>
        </Grid>

        {/* Tipografía */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Variantes de Tipografía
            </Typography>
            <Typography variant="h6">Heading 6</Typography>
            <Typography variant="subtitle1">Subtitle 1</Typography>
            <Typography variant="body1" paragraph>
              Body 1: Este es un ejemplo de texto en el cuerpo del documento.
              Material UI ofrece múltiples variantes tipográficas.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Body 2: Texto secundario con menor énfasis.
            </Typography>
            <Typography variant="caption" display="block">
              Caption: Texto pequeño para notas.
            </Typography>
          </Paper>
        </Grid>

        {/* Panel de información */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
            <CardContent>
              <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'white' }}>
                🎨 ¡Material UI está listo!
              </Typography>
              <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                Ahora puedes usar todos estos componentes en tu proyecto SIGAD.
                Visita la documentación oficial para ver más opciones y personalizaciones.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" variant="contained" sx={{ bgcolor: 'white', color: '#2196F3' }}>
                Documentación
              </Button>
              <Button size="small" variant="outlined" sx={{ color: 'white', borderColor: 'white' }}>
                Ejemplos
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default MaterialUIDemo;
