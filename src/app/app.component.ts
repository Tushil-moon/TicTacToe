import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GameComponent } from './Modules/game/game.component';
import { PopupComponent } from './Shared/popup/popup.component';
declare var particlesJS: any;
declare var $: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameComponent, PopupComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'tic-tac-toe';
}
