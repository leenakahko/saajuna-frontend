import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { JunaAsemaService } from '../juna-asema.service';
import { RautatieAsemat } from '../rautatieAsemat';
import { HavaintoasemaService } from '../havaintoasema.service';
import { HavaintoAsemat } from '../havaintoasemat';
import { FavoriteService } from '../favorite.service';
import { Favorite } from '../favorite';
import { Kayttaja } from '../kayttaja';
import { Observable, OperatorFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, filter } from 'rxjs/operators';
import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-omattiedot',
  templateUrl: './omattiedot.component.html',
  styleUrls: ['./omattiedot.component.css']
})
export class OmattiedotComponent implements OnInit {
  error = '';
  error1 = '';
  salasanainfo = '';
  poistoinfo = '';
  junainfo = '';
  admintieto = '';
  public username: string;
  rautatietasemat : Array<RautatieAsemat> = [];
  havaintoasemat: Array<HavaintoAsemat> = [];

  // Käyttäjiin liittyvät
  kayttajat: Array<Kayttaja> = [];

  // Suosikkeihin liittyvät
  suosikitlista: Array<Favorite> = [];
  suosikit: Favorite;
  id: string;
  suosikkiUsername: string;
  favoritesSaa1: number;
  favoritesSaa2: number;
  favoritesJuna1: string;
  favoritesJuna2: string;
  favoritesSaa1Name: string;
  favoritesSaa2Name: string;
  favoritesJuna1Name: string;
  favoritesJuna2Name: string;

  // Rautatie- ja säähavaintoasemien hakuun nettisivulla
  formatterRauta = (rauta: RautatieAsemat) => rauta.stationName;
  formatterSaa = (saa: HavaintoAsemat) => saa.name;

  // injektoidaan router ja authService
  constructor(
    private router: Router,
    private authService: AuthService,
    private junaAsematService: JunaAsemaService,
    private favoriteService: FavoriteService,
    private havaintoAsemaService: HavaintoasemaService) {
      // Jos token on jo sessionStoragessa, otetaan se sieltä muistiin
      const currentUser = JSON.parse(sessionStorage.getItem('accesstoken'));
      this.username = currentUser && currentUser.username;

      // Haetaan suosikki säähavainto- ja rautatieasemat
      this.junaAsematService.haeAsemat().subscribe(data => this.rautatietasemat = data);
      this.havaintoAsemaService.haeHavaintoAsemat().subscribe(data => this.havaintoasemat = data);
      
      // Jos admin on kirjautunut, niin haetaan käyttäjät
      if (this.username === 'admin') {
        this.haeKayttajat();
      }
    }

  ngOnInit() {
    // Jos on joku muu kuin admin-käyttäjä niin haetaan tiedot
    if (this.username !== 'admin') {
      this.haeSuosikit(this.username);
      this.haeKaikkiSuosikit();
    }
  }

  salasanvaihto(formData, isFormValid: boolean) {
    // Tarkistetaan onko uusi ja vanha salasan samoja
    if (formData.vanhasalasana !== formData.salasana) {
      // Tarkistetaan onko uusi ja sama uudelleen salasanat samoja
      if (formData.salasana === formData.salasana2) {
        // Tähän laittaa salasanan poistolle pyyntö
        this.authService.vaihdaSalana(formData.salasana)
          .subscribe(result => {
            if (result === true) {
              } else {
                this.salasanainfo = 'Salasana vaihdettu';
              }
          })
      } else {
        this.error = 'Salasanat eivät täsmää';
      }
    } else {
      this.error1 = 'Uusi ja vanha sama salasana'
    }
  }

  // Kun käyttöliittymässä painetaan Tyhjennä nappia poistetaan samalla virheet ja päivitetään Omat tiedot sivusto
  virheidenPoisto() {
    this.error = '';
    this.error1 = '';
    this.router.navigate(['/omattiedot']);
  }

  // Tunnuksen poisto
  poistaTunnus() {
    this.authService.poistaTunnus()
      .subscribe(result => {
      if (result === true) {

      } else {
        this.favoriteService.poistaSuosikkiTunnus(this.suosikit._id).subscribe(result => {
          if (result === true) {
            console.log('Suosikin poisto epäonnistui')
          } else  {
            console.log('Suosikin poisto onnistui')
          }
        });
        this.poistoinfo = 'Käyttäjätunnus on poistettu';
        this.authService.logout(); // Tehdään uloskirjautuminen
        window.location.reload(); // Ladataan sivu uudelleen
      }
    });
  }

  // Rautatieasemien lisäys admin oikeudella
  lisaaJunaAsemat() {
    this.junaAsematService.lisaaAsemat()
      .subscribe(result => {
      if (result === true) {
        
      } else {
        this.junainfo = 'Rautatieasemat lisätty';
      }
    });
  }

  // Rautatieasemien poisto admin oikeudella
  poistaJunaAsemat() {
    this.junaAsematService.poistaAsemat()
      .subscribe(result => {
      if (result === true) {
        
      } else {
        this.junainfo = 'Rautatieasemat poistettu';
      }
    });
  }

  // Haetaan kaikki suosikit
  haeKaikkiSuosikit() {
    this.favoriteService.haeKaikkiSuosikit().subscribe(data => this.suosikitlista = data);
  }

  // Hae suosikki sää- ja rautatieasemat
  haeSuosikit(username) {
    this.favoriteService.haeSuosikit(username).subscribe(data => this.suosikit = data);

    this.favoriteService.haeSuosikit(username).subscribe((dataUser:any) => {

      // Haetaan rautatieaseman suosikit
      this.junaAsematService.haeAsemat().subscribe((data:any) => {
        for (let x = 0; x < data.length; x++) {

          // Suosikki rautatatie 1
          if (dataUser.favoritesJuna1 === data[x].stationShortCode) {
            this.favoritesJuna1Name = data[x].stationName;
          }

          // Suosikki rautatatie 2
          if (dataUser.favoritesJuna2 === data[x].stationShortCode) {
            this.favoritesJuna2Name = data[x].stationName;
          }
        }
      })

      // Haetaan säähavaintoasema suosikit
      this.havaintoAsemaService.haeHavaintoAsemat().subscribe((data:any) => {
        for (let x = 0; x < data.length; x++) {

          // Suosikki rautatatie 1
          if (dataUser.favoritesSaa1 === data[x].fmisid) {
            this.favoritesSaa1Name = data[x].name;
          }

          // Suosikki rautatatie 2
          if (dataUser.favoritesSaa2 === data[x].fmisid) {
            this.favoritesSaa2Name = data[x].name;
          }
        }
      })
    });
  }
  
  // Säähavainto- ja rautatieasemien haku kentät
  searchRautatie1: OperatorFunction<string, readonly {stationName}[]> = (text$: Observable<string>) => text$.pipe(
    debounceTime(200),
    distinctUntilChanged(),
    filter(term => term.length >= 2),
    map(term => this.rautatietasemat.filter(rauta => new RegExp(term, 'mi').test(rauta.stationName)).slice(0, 10))
  )

  searchRautatie2: OperatorFunction<string, readonly {stationName}[]> = (text$: Observable<string>) => text$.pipe(
    debounceTime(200),
    distinctUntilChanged(),
    filter(term => term.length >= 2),
    map(term => this.rautatietasemat.filter(rauta => new RegExp(term, 'mi').test(rauta.stationName)).slice(0, 10))
  )

  searchSaa1: OperatorFunction<string, readonly {name}[]> = (text$: Observable<string>) => text$.pipe(
    debounceTime(200),
    distinctUntilChanged(),
    filter(term => term.length >= 2),
    map(term => this.havaintoasemat.filter(saa => new RegExp(term, 'mi').test(saa.name)).slice(0, 10))
  )

  searchSaa2: OperatorFunction<string, readonly {name}[]> = (text$: Observable<string>) => text$.pipe(
    debounceTime(200),
    distinctUntilChanged(),
    filter(term => term.length >= 2),
    map(term => this.havaintoasemat.filter(saa => new RegExp(term, 'mi').test(saa.name)).slice(0, 10))
  )

  // Suosikki sää- ja rautatieasemien päivitys
  suosikkienPaivitys(formData) {
    // Esitellään sää- ja junaasemien muuttujat
    let fsaa1, fsaa2, fjuna1, fjuna2;

    // Tarkistetaan, että onko datassa undefined, jos ei ole niin tallennetaan tuleva sanoma. Muuten undefined ei aiheuta muutosta
    if (formData.favoritesSaa1 !== undefined) {
      fsaa1 = formData.favoritesSaa1.fmisid
    }

    if (formData.favoritesSaa2 !== undefined) {
      fsaa2 = formData.favoritesSaa2.fmisid
    }

    if (formData.favoritesJuna1 !== undefined) {
      fjuna1 = formData.favoritesJuna1.stationShortCode
    }

    if (formData.favoritesJuna2 !== undefined) {
      fjuna2 = formData.favoritesJuna2.stationShortCode
    }

    // Päivitetään tiedot tietokantaan
    this.favoriteService.paivitaSuosikit(this.suosikit._id, fsaa1, fsaa2, fjuna1, fjuna2)
      .subscribe(() => this.haeSuosikit(this.username))
  }

  // Hae kaikki käyttäjät admin työkaluun
  haeKayttajat() {
    this.authService.haeKaikkiKayttajat()
      .subscribe(data => this.kayttajat = data);
  }

  // Käyttäjän poistaminen ja haetaan käyttäjälistaus uudelleen
  poistaKayttaja(k: Kayttaja) {

    let suosikkiId = '';

    for (let x = 0; this.suosikitlista.length > x; x++) {
      if (this.suosikitlista[x].username === k.username) {
        suosikkiId = this.suosikitlista[x]._id;
      }
    }

    console.log(suosikkiId);

    this.authService.poistaTunnusId(k._id)
      .subscribe(() => {
        this.favoriteService.poistaSuosikkiTunnus(suosikkiId)
          .subscribe(() => this.haeKayttajat())})
    }
}


