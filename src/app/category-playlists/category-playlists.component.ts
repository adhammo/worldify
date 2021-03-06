import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SpotifyService } from '../services/spotify.service';
import { BrowserStorageService } from '../services/browser-storage.service';

@Component({
  selector: 'app-category-playlists',
  templateUrl: './category-playlists.component.html',
  styleUrls: ['./category-playlists.component.css']
})
export class CategoryPlaylistsComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotifyService: SpotifyService,
    private browserStorageService: BrowserStorageService
  ) { }

  name;
  playlists;
  favorites: Array<String> = [];
  favoritesItems: Array<any> = [];

  ngOnInit(): void {
    if (!this.spotifyService.isAuthenticated()) {
      this.router.navigate(['login']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');

    this.route
      .queryParams
      .subscribe(params => {
          this.name = params.name;
      });

    const favs = localStorage.getItem(`fav-${id}`);
    if (favs) {
      this.favorites = [...JSON.parse(favs)];
      this.favorites.forEach(async (id) => this.favoritesItems.push(await this.spotifyService.getPlaylist(id).toPromise()));
    }

    const countryCode = this.browserStorageService.getCountryCode();
    this.spotifyService.getPlaylistsById(id, countryCode).subscribe(
      res => {
        this.playlists = res.playlists;
      }, err => {
        if (err.status === 401) {
          this.spotifyService.retrieveToken(window.location.origin);
        }
      }
    );
  }

  open(item: { uri: string; }): void {
    window.location.href = item.uri;
  }

  isFavorite(id): boolean {
    return this.favorites.some((fav) => fav == id);
  }
  
  async favorite(id): Promise<void> {
    if (this.isFavorite(id)) {
      this.favorites = this.favorites.filter((fav) => fav !== id);
      this.favoritesItems = this.favoritesItems.filter((fav) => fav.id !== id);
    } else {
      this.favorites.push(id);
      this.favoritesItems.push(await this.spotifyService.getPlaylist(id).toPromise());
    }

    const category = this.route.snapshot.paramMap.get('id');
    localStorage.setItem(`fav-${category}`, JSON.stringify(this.favorites));

    if (this.favorites.length == 0)
      localStorage.removeItem(`fav-${category}`);

    const favCategories = localStorage.getItem('fav-categories');
    if (favCategories)
    {
      const categories = JSON.parse(favCategories);
      if (categories.includes(category) && this.favorites.length === 0)
      {
        const newCategories = categories.filter((list) => list !== category);
        localStorage.setItem('fav-categories', JSON.stringify(newCategories));

        if (newCategories.length == 0)
          localStorage.removeItem('fav-categories');
      }
      else if (!categories.includes(category) && this.favorites.length !== 0)
        localStorage.setItem('fav-categories', JSON.stringify([...categories, category]));
    }
    else if (this.favorites.length != 0)
      localStorage.setItem('fav-categories', JSON.stringify([ category ]))
  }

}
