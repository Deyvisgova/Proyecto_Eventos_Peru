import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventoCliente } from './evento-cliente';

describe('EventoCliente', () => {
  let component: EventoCliente;
  let fixture: ComponentFixture<EventoCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventoCliente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
