import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroProveedor } from './registro-proveedor';

describe('RegistroProveedor', () => {
  let component: RegistroProveedor;
  let fixture: ComponentFixture<RegistroProveedor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroProveedor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroProveedor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
