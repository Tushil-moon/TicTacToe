import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PopupService } from '../../Services/popup/popup.service';

@Component({
  selector: 'app-popup',
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.css',
})
export class PopupComponent {
  constructor(public popupService: PopupService) {}
}
