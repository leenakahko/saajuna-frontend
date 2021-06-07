import { Component, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnDestroy {
  login: boolean;
  adminlogin: boolean; // Saadaan sessionStoragesta, onko kirjatunut admin vai ei
  subscription: Subscription; // Subscription -tyyppiseen olioon voidaan tallentaa observablen tilaus.

  constructor(private authService: AuthService) {
    // Tilataan viesti ja tallennetaan tulos this.login -muuttujaan
    this.subscription = this.authService.loginTrue().subscribe(message => { this.login = message; });

    // Tilataan viesti ja tallennetaan tulos this.adminlogin -muuttujaan. Jos admin-tunnuksella on kirjauduttu
    this.subscription = this.authService.adminLoginTrue().subscribe(message => { this.adminlogin = message; });

    /* varmistetaan että login -tila säilyy myös kun sivu päivitetään
       varmistus tehdään katsomalla onko token sessionstoragessa.
       Yllä oleva observablen tilaus silti tarvitaan, sillä sessionstoragen
       tarkistus vaatii aina reffauksen koska sitä ei voi kutsua asynkronisesti. */
    const atoken = sessionStorage.getItem('accesstoken');
    if (atoken) {
      this.login = true;
    } else {
      this.login = false;
    }

  }

  ngOnDestroy() {
    // lopetetaan tilaus kun komponentti tuhotaan
    this.subscription.unsubscribe();
  }

  doLogout() {
    this.login = false;
    this.adminlogin = false;
  }

}
