import { Evento } from './evento';
import { CatalogoServicio } from './catalogo-servicio';

export interface CatalogoEventoServicio {
  idCatalogoEvento: number;
  evento: Evento;
  catalogoServicio: CatalogoServicio;
}
