(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;
  var U = window.FS.Utils;


  var COUNTRY_NAME_OVERRIDES = {
  "russia": [
    [
      "Aleksandr",
      "Dmitry",
      "Ivan",
      "Mikhail",
      "Sergey",
      "Nikita",
      "Artem",
      "Kirill"
    ],
    [
      "Ivanov",
      "Smirnov",
      "Kuznetsov",
      "Popov",
      "Volkov",
      "Sokolov",
      "Morozov",
      "Orlov"
    ]
  ],
  "usa": [
    [
      "James",
      "Michael",
      "Robert",
      "John",
      "David",
      "William",
      "Anthony",
      "Daniel"
    ],
    [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Miller",
      "Davis",
      "Wilson"
    ]
  ],
  "mexico": [
    [
      "Jose",
      "Juan",
      "Luis",
      "Carlos",
      "Miguel",
      "Jorge",
      "Ricardo",
      "Fernando"
    ],
    [
      "Hernandez",
      "Garcia",
      "Martinez",
      "Lopez",
      "Gonzalez",
      "Rodriguez",
      "Perez",
      "Sanchez"
    ]
  ],
  "japan": [
    [
      "Haruto",
      "Yuto",
      "Sota",
      "Ren",
      "Daiki",
      "Kaito",
      "Riku",
      "Takumi"
    ],
    [
      "Sato",
      "Suzuki",
      "Takahashi",
      "Tanaka",
      "Watanabe",
      "Ito",
      "Yamamoto",
      "Nakamura"
    ]
  ],
  "uk": [
    [
      "Oliver",
      "Jack",
      "Harry",
      "George",
      "Thomas",
      "James",
      "William",
      "Daniel"
    ],
    [
      "Smith",
      "Jones",
      "Taylor",
      "Brown",
      "Williams",
      "Wilson",
      "Johnson",
      "Davies"
    ]
  ],
  "canada": [
    [
      "Liam",
      "Noah",
      "Ethan",
      "Lucas",
      "Logan",
      "Mason",
      "Owen",
      "Jack"
    ],
    [
      "Smith",
      "Brown",
      "Tremblay",
      "Martin",
      "Roy",
      "Wilson",
      "MacDonald",
      "Taylor"
    ]
  ],
  "cuba": [
    [
      "Yordan",
      "Yunier",
      "Luis",
      "Carlos",
      "Yoel",
      "Rafael",
      "Osvaldo",
      "Jorge"
    ],
    [
      "Hernandez",
      "Garcia",
      "Rodriguez",
      "Perez",
      "Gonzalez",
      "Martinez",
      "Sanchez",
      "Castillo"
    ]
  ],
  "kazakhstan": [
    [
      "Alikhan",
      "Nursultan",
      "Daniyar",
      "Aidos",
      "Bekzat",
      "Timur",
      "Askar",
      "Yerlan"
    ],
    [
      "Nurmagambetov",
      "Sarsenov",
      "Akhmetov",
      "Kozhabekov",
      "Tulegenov",
      "Iskakov",
      "Orazov",
      "Karimov"
    ]
  ],
  "ukraine": [
    [
      "Oleksandr",
      "Andrii",
      "Dmytro",
      "Mykola",
      "Vladyslav",
      "Bohdan",
      "Serhii",
      "Artem"
    ],
    [
      "Shevchenko",
      "Kovalenko",
      "Bondarenko",
      "Tkachenko",
      "Melnyk",
      "Kravchenko",
      "Boyko",
      "Lysenko"
    ]
  ],
  "czechia": [
    [
      "Jan",
      "Petr",
      "Tomas",
      "Lukas",
      "Martin",
      "Jakub",
      "Ondrej",
      "Marek"
    ],
    [
      "Novak",
      "Svoboda",
      "Dvorak",
      "Prochazka",
      "Cerny",
      "Kucera",
      "Vesely",
      "Horak"
    ]
  ],
  "slovakia": [
    [
      "Marek",
      "Milan",
      "Tomas",
      "Lukas",
      "Peter",
      "Jan",
      "Martin",
      "Juraj"
    ],
    [
      "Horvath",
      "Kovac",
      "Varga",
      "Toth",
      "Nagy",
      "Balaz",
      "Molnar",
      "Kral"
    ]
  ],
  "poland": [
    [
      "Jan",
      "Piotr",
      "Kamil",
      "Mateusz",
      "Adam",
      "Pawel",
      "Tomasz",
      "Marek"
    ],
    [
      "Nowak",
      "Kowalski",
      "Wisniewski",
      "Wojcik",
      "Kowalczyk",
      "Kaminski",
      "Lewandowski",
      "Zielinski"
    ]
  ],
  "belarus": [
    [
      "Aliaksandr",
      "Maksim",
      "Dmitry",
      "Pavel",
      "Kiryl",
      "Mikalai",
      "Anton",
      "Ihar"
    ],
    [
      "Ivanou",
      "Kavalchuk",
      "Novik",
      "Kuzmich",
      "Sokolau",
      "Marozau",
      "Kravets",
      "Mikhalchuk"
    ]
  ],
  "moldova": [
    [
      "Ion",
      "Andrei",
      "Mihai",
      "Sergiu",
      "Vasile",
      "Alexandru",
      "Dumitru",
      "Victor"
    ],
    [
      "Rusu",
      "Ceban",
      "Munteanu",
      "Grosu",
      "Ciobanu",
      "Popescu",
      "Moraru",
      "Lungu"
    ]
  ],
  "romania": [
    [
      "Andrei",
      "Mihai",
      "Alexandru",
      "Stefan",
      "Vlad",
      "Ionut",
      "Cristian",
      "Florin"
    ],
    [
      "Popescu",
      "Ionescu",
      "Dumitrescu",
      "Stan",
      "Stoica",
      "Radu",
      "Gheorghe",
      "Marin"
    ]
  ],
  "bulgaria": [
    [
      "Georgi",
      "Ivan",
      "Dimitar",
      "Nikolay",
      "Petar",
      "Stoyan",
      "Hristo",
      "Vasil"
    ],
    [
      "Ivanov",
      "Georgiev",
      "Dimitrov",
      "Petrov",
      "Nikolov",
      "Stoyanov",
      "Todorov",
      "Angelov"
    ]
  ],
  "serbia": [
    [
      "Nikola",
      "Marko",
      "Stefan",
      "Luka",
      "Milos",
      "Aleksandar",
      "Dusan",
      "Nemanja"
    ],
    [
      "Jovanovic",
      "Petrovic",
      "Nikolic",
      "Markovic",
      "Djordjevic",
      "Stojanovic",
      "Ilic",
      "Pavlovic"
    ]
  ],
  "croatia": [
    [
      "Ivan",
      "Marko",
      "Luka",
      "Matej",
      "Josip",
      "Ante",
      "Stjepan",
      "Domagoj"
    ],
    [
      "Horvat",
      "Kovac",
      "Babic",
      "Maric",
      "Novak",
      "Jukic",
      "Tomic",
      "Vidovic"
    ]
  ],
  "greece": [
    [
      "Giorgos",
      "Dimitris",
      "Nikos",
      "Kostas",
      "Panagiotis",
      "Vasilis",
      "Stavros",
      "Alexis"
    ],
    [
      "Papadopoulos",
      "Nikolaou",
      "Georgiou",
      "Dimitriou",
      "Ioannou",
      "Pappas",
      "Vasileiou",
      "Kostas"
    ]
  ],
  "hungary": [
    [
      "Bence",
      "Mate",
      "Levente",
      "David",
      "Adam",
      "Gergo",
      "Tamas",
      "Zoltan"
    ],
    [
      "Nagy",
      "Kovacs",
      "Toth",
      "Szabo",
      "Horvath",
      "Varga",
      "Kiss",
      "Molnar"
    ]
  ],
  "lithuania": [
    [
      "Mantas",
      "Jonas",
      "Tomas",
      "Lukas",
      "Domas",
      "Mindaugas",
      "Arnas",
      "Vytautas"
    ],
    [
      "Kazlauskas",
      "Petrauskas",
      "Jankauskas",
      "Stankevicius",
      "Butkus",
      "Paulauskas",
      "Zukauskas",
      "Vaitkus"
    ]
  ],
  "latvia": [
    [
      "Janis",
      "Arturs",
      "Kristaps",
      "Rihards",
      "Martins",
      "Andris",
      "Edgars",
      "Gints"
    ],
    [
      "Berzins",
      "Kalnins",
      "Ozols",
      "Jansons",
      "Liepa",
      "Krumins",
      "Balodis",
      "Petersons"
    ]
  ],
  "estonia": [
    [
      "Jaan",
      "Martin",
      "Kristjan",
      "Rasmus",
      "Markus",
      "Siim",
      "Andres",
      "Mihkel"
    ],
    [
      "Tamm",
      "Saar",
      "Sepp",
      "Kask",
      "Kukk",
      "Rebane",
      "Vaher",
      "Lepp"
    ]
  ],
  "germany": [
    [
      "Maximilian",
      "Lukas",
      "Leon",
      "Felix",
      "Jonas",
      "Paul",
      "Tobias",
      "Florian"
    ],
    [
      "Muller",
      "Schmidt",
      "Schneider",
      "Fischer",
      "Weber",
      "Meyer",
      "Wagner",
      "Becker"
    ]
  ],
  "france": [
    [
      "Lucas",
      "Hugo",
      "Jules",
      "Louis",
      "Antoine",
      "Mathieu",
      "Maxime",
      "Nicolas"
    ],
    [
      "Martin",
      "Bernard",
      "Dubois",
      "Thomas",
      "Robert",
      "Petit",
      "Durand",
      "Moreau"
    ]
  ],
  "italy": [
    [
      "Luca",
      "Marco",
      "Matteo",
      "Alessandro",
      "Francesco",
      "Giovanni",
      "Andrea",
      "Davide"
    ],
    [
      "Rossi",
      "Russo",
      "Ferrari",
      "Esposito",
      "Bianchi",
      "Romano",
      "Colombo",
      "Ricci"
    ]
  ],
  "spain": [
    [
      "Alejandro",
      "Carlos",
      "Javier",
      "Daniel",
      "Pablo",
      "Sergio",
      "Miguel",
      "David"
    ],
    [
      "Garcia",
      "Rodriguez",
      "Gonzalez",
      "Fernandez",
      "Lopez",
      "Martinez",
      "Sanchez",
      "Perez"
    ]
  ],
  "ireland": [
    [
      "Sean",
      "Conor",
      "Liam",
      "Cian",
      "Patrick",
      "Darragh",
      "Eoin",
      "Niall"
    ],
    [
      "Murphy",
      "Kelly",
      "Byrne",
      "Ryan",
      "Walsh",
      "OBrien",
      "Doyle",
      "McCarthy"
    ]
  ],
  "netherlands": [
    [
      "Daan",
      "Sem",
      "Luuk",
      "Bram",
      "Milan",
      "Jesse",
      "Finn",
      "Lars"
    ],
    [
      "De Jong",
      "Jansen",
      "De Vries",
      "Van den Berg",
      "Bakker",
      "Visser",
      "Smit",
      "Meijer"
    ]
  ],
  "belgium": [
    [
      "Lucas",
      "Noah",
      "Arthur",
      "Louis",
      "Liam",
      "Jules",
      "Victor",
      "Milan"
    ],
    [
      "Peeters",
      "Janssens",
      "Maes",
      "Jacobs",
      "Mertens",
      "Willems",
      "Claes",
      "Goossens"
    ]
  ],
  "sweden": [
    [
      "Erik",
      "Lars",
      "Karl",
      "Oskar",
      "Nils",
      "Viktor",
      "Gustav",
      "Axel"
    ],
    [
      "Andersson",
      "Johansson",
      "Karlsson",
      "Nilsson",
      "Eriksson",
      "Larsson",
      "Olsson",
      "Persson"
    ]
  ],
  "norway": [
    [
      "Ole",
      "Lars",
      "Magnus",
      "Sander",
      "Mikkel",
      "Jonas",
      "Erik",
      "Kasper"
    ],
    [
      "Hansen",
      "Johansen",
      "Olsen",
      "Larsen",
      "Andersen",
      "Nilsen",
      "Pedersen",
      "Berg"
    ]
  ],
  "denmark": [
    [
      "Mads",
      "Mathias",
      "Frederik",
      "Christian",
      "Emil",
      "Jonas",
      "Rasmus",
      "Kasper"
    ],
    [
      "Jensen",
      "Nielsen",
      "Hansen",
      "Pedersen",
      "Andersen",
      "Christensen",
      "Larsen",
      "Sorensen"
    ]
  ],
  "finland": [
    [
      "Elias",
      "Onni",
      "Eino",
      "Leo",
      "Mikael",
      "Aleksi",
      "Juho",
      "Jere"
    ],
    [
      "Korhonen",
      "Virtanen",
      "Makinen",
      "Nieminen",
      "Hamalainen",
      "Laine",
      "Heikkinen",
      "Koskinen"
    ]
  ],
  "turkey": [
    [
      "Mehmet",
      "Mustafa",
      "Ahmet",
      "Ali",
      "Emre",
      "Yusuf",
      "Murat",
      "Hakan"
    ],
    [
      "Yilmaz",
      "Kaya",
      "Demir",
      "Celik",
      "Sahin",
      "Yildiz",
      "Aydin",
      "Ozturk"
    ]
  ],
  "uzbekistan": [
    [
      "Sardor",
      "Bekzod",
      "Jasur",
      "Aziz",
      "Doston",
      "Shakhzod",
      "Oybek",
      "Alisher"
    ],
    [
      "Karimov",
      "Tursunov",
      "Rakhimov",
      "Yusupov",
      "Ismailov",
      "Khalilov",
      "Nazarov",
      "Saidov"
    ]
  ],
  "china": [
    [
      "Wei",
      "Jun",
      "Lei",
      "Ming",
      "Hao",
      "Jian",
      "Tao",
      "Qiang"
    ],
    [
      "Wang",
      "Li",
      "Zhang",
      "Liu",
      "Chen",
      "Yang",
      "Huang",
      "Zhao"
    ]
  ],
  "south_korea": [
    [
      "Minjun",
      "Seojun",
      "Jihoon",
      "Hyunwoo",
      "Jisung",
      "Taeyang",
      "Donghyun",
      "Joon"
    ],
    [
      "Kim",
      "Lee",
      "Park",
      "Choi",
      "Jung",
      "Kang",
      "Cho",
      "Yoon"
    ]
  ],
  "india": [
    [
      "Arjun",
      "Rohan",
      "Amit",
      "Vikram",
      "Rahul",
      "Karan",
      "Sanjay",
      "Deepak"
    ],
    [
      "Sharma",
      "Patel",
      "Singh",
      "Kumar",
      "Gupta",
      "Mehta",
      "Verma",
      "Reddy"
    ]
  ],
  "pakistan": [
    [
      "Ali",
      "Ahmed",
      "Hassan",
      "Usman",
      "Bilal",
      "Hamza",
      "Imran",
      "Farhan"
    ],
    [
      "Khan",
      "Ahmed",
      "Hussain",
      "Malik",
      "Butt",
      "Sheikh",
      "Raza",
      "Iqbal"
    ]
  ],
  "iran": [
    [
      "Amir",
      "Reza",
      "Ali",
      "Hossein",
      "Mehdi",
      "Mohammad",
      "Saeed",
      "Farhad"
    ],
    [
      "Hosseini",
      "Ahmadi",
      "Karimi",
      "Mohammadi",
      "Rezaei",
      "Ebrahimi",
      "Moradi",
      "Jafari"
    ]
  ],
  "iraq": [
    [
      "Ali",
      "Hussein",
      "Omar",
      "Mohammed",
      "Ahmed",
      "Mustafa",
      "Karrar",
      "Yasir"
    ],
    [
      "Al-Hassan",
      "Al-Ali",
      "Al-Saadi",
      "Al-Tamimi",
      "Al-Jabari",
      "Mahdi",
      "Karim",
      "Salim"
    ]
  ],
  "saudi_arabia": [
    [
      "Fahad",
      "Saud",
      "Khalid",
      "Abdullah",
      "Mohammed",
      "Nasser",
      "Yousef",
      "Turki"
    ],
    [
      "Al-Qahtani",
      "Al-Otaibi",
      "Al-Harbi",
      "Al-Dosari",
      "Al-Ghamdi",
      "Al-Shehri",
      "Al-Mutairi",
      "Al-Rashid"
    ]
  ],
  "uae": [
    [
      "Rashid",
      "Saeed",
      "Khalifa",
      "Mansour",
      "Hamad",
      "Sultan",
      "Nasser",
      "Majid"
    ],
    [
      "Al-Mansouri",
      "Al-Ali",
      "Al-Hammadi",
      "Al-Nuaimi",
      "Al-Suwaidi",
      "Al-Kaabi",
      "Al-Dhaheri",
      "Al-Mazrouei"
    ]
  ],
  "qatar": [
    [
      "Khalid",
      "Hamad",
      "Jassim",
      "Nasser",
      "Fahad",
      "Ali",
      "Mohammed",
      "Saad"
    ],
    [
      "Al-Thani",
      "Al-Kuwari",
      "Al-Mannai",
      "Al-Ansari",
      "Al-Marri",
      "Al-Hajri",
      "Al-Naimi",
      "Al-Sulaiti"
    ]
  ],
  "syria": [
    [
      "Omar",
      "Fadi",
      "Mahmoud",
      "Khaled",
      "Hassan",
      "Youssef",
      "Tarek",
      "Nabil"
    ],
    [
      "Al-Hassan",
      "Al-Ahmad",
      "Darwish",
      "Khalil",
      "Nasser",
      "Saleh",
      "Haddad",
      "Mansour"
    ]
  ],
  "jordan": [
    [
      "Omar",
      "Ahmad",
      "Mohammad",
      "Yazan",
      "Laith",
      "Anas",
      "Zaid",
      "Khaled"
    ],
    [
      "Al-Masri",
      "Al-Khatib",
      "Al-Haddad",
      "Naser",
      "Salameh",
      "Mansour",
      "Awad",
      "Taha"
    ]
  ],
  "mongolia": [
    [
      "Baatar",
      "Temuulen",
      "Bat-Erdene",
      "Enkhbayar",
      "Munkh",
      "Tugsbayar",
      "Ganbold",
      "Altan"
    ],
    [
      "Batbold",
      "Ganbaatar",
      "Enkhbold",
      "Munkhbat",
      "Erdenebat",
      "Boldbaatar",
      "Davaajav",
      "Tserendorj"
    ]
  ],
  "azerbaijan": [
    [
      "Ali",
      "Rashad",
      "Elvin",
      "Tural",
      "Nicat",
      "Orkhan",
      "Farid",
      "Elnur"
    ],
    [
      "Mammadov",
      "Aliyev",
      "Huseynov",
      "Hasanov",
      "Karimov",
      "Ismayilov",
      "Guliyev",
      "Abbasov"
    ]
  ],
  "armenia": [
    [
      "Aram",
      "Tigran",
      "Narek",
      "Gevorg",
      "Hayk",
      "Artur",
      "Vardan",
      "Karen"
    ],
    [
      "Grigoryan",
      "Sargsyan",
      "Harutyunyan",
      "Hovhannisyan",
      "Khachatryan",
      "Petrosyan",
      "Manukyan",
      "Hakobyan"
    ]
  ],
  "georgia": [
    [
      "Giorgi",
      "Luka",
      "Nika",
      "Davit",
      "Irakli",
      "Levan",
      "Zurab",
      "Tornike"
    ],
    [
      "Beridze",
      "Kapanadze",
      "Gelashvili",
      "Maisuradze",
      "Giorgadze",
      "Lomidze",
      "Kvaratskhelia",
      "Tsiklauri"
    ]
  ],
  "australia": [
    [
      "Jack",
      "William",
      "Noah",
      "Thomas",
      "James",
      "Lucas",
      "Henry",
      "Cooper"
    ],
    [
      "Smith",
      "Jones",
      "Williams",
      "Brown",
      "Wilson",
      "Taylor",
      "Martin",
      "Anderson"
    ]
  ],
  "new_zealand": [
    [
      "Wiremu",
      "Hemi",
      "Nikau",
      "Tane",
      "Ariki",
      "James",
      "Oliver",
      "Liam"
    ],
    [
      "Williams",
      "Smith",
      "Wilson",
      "Brown",
      "Taylor",
      "Thompson",
      "Walker",
      "Kingi"
    ]
  ],
  "brazil": [
    [
      "Joao",
      "Pedro",
      "Lucas",
      "Gabriel",
      "Matheus",
      "Rafael",
      "Bruno",
      "Felipe"
    ],
    [
      "Silva",
      "Santos",
      "Oliveira",
      "Souza",
      "Pereira",
      "Costa",
      "Rodrigues",
      "Almeida"
    ]
  ],
  "argentina": [
    [
      "Santiago",
      "Mateo",
      "Thiago",
      "Juan",
      "Nicolas",
      "Lautaro",
      "Facundo",
      "Joaquin"
    ],
    [
      "Gonzalez",
      "Rodriguez",
      "Fernandez",
      "Lopez",
      "Martinez",
      "Garcia",
      "Perez",
      "Romero"
    ]
  ],
  "colombia": [
    [
      "Santiago",
      "Sebastian",
      "Juan",
      "Daniel",
      "Mateo",
      "Andres",
      "Carlos",
      "Nicolas"
    ],
    [
      "Rodriguez",
      "Gomez",
      "Martinez",
      "Garcia",
      "Lopez",
      "Hernandez",
      "Perez",
      "Sanchez"
    ]
  ],
  "peru": [
    [
      "Luis",
      "Jose",
      "Carlos",
      "Miguel",
      "Diego",
      "Jorge",
      "Renato",
      "Aldo"
    ],
    [
      "Quispe",
      "Flores",
      "Sanchez",
      "Garcia",
      "Huaman",
      "Rojas",
      "Torres",
      "Mamani"
    ]
  ],
  "chile": [
    [
      "Matias",
      "Benjamin",
      "Vicente",
      "Diego",
      "Joaquin",
      "Felipe",
      "Tomas",
      "Ignacio"
    ],
    [
      "Gonzalez",
      "Munoz",
      "Rojas",
      "Diaz",
      "Perez",
      "Soto",
      "Contreras",
      "Silva"
    ]
  ],
  "ecuador": [
    [
      "Jose",
      "Luis",
      "Carlos",
      "Andres",
      "Diego",
      "Jhon",
      "Bryan",
      "Mateo"
    ],
    [
      "Garcia",
      "Rodriguez",
      "Zambrano",
      "Vera",
      "Mendoza",
      "Sanchez",
      "Castro",
      "Cedeño"
    ]
  ],
  "uruguay": [
    [
      "Santiago",
      "Mateo",
      "Facundo",
      "Agustin",
      "Nicolas",
      "Matias",
      "Diego",
      "Joaquin"
    ],
    [
      "Rodriguez",
      "Fernandez",
      "Martinez",
      "Gonzalez",
      "Silva",
      "Pereira",
      "Sosa",
      "Acosta"
    ]
  ],
  "paraguay": [
    [
      "Derlis",
      "Roque",
      "Oscar",
      "Miguel",
      "Juan",
      "Carlos",
      "Angel",
      "Hugo"
    ],
    [
      "Gonzalez",
      "Benitez",
      "Martinez",
      "Lopez",
      "Gimenez",
      "Vera",
      "Acosta",
      "Ayala"
    ]
  ],
  "bolivia": [
    [
      "Luis",
      "Carlos",
      "Miguel",
      "Diego",
      "Jose",
      "Juan",
      "Raul",
      "Edwin"
    ],
    [
      "Mamani",
      "Quispe",
      "Condori",
      "Flores",
      "Vargas",
      "Rojas",
      "Gutierrez",
      "Choque"
    ]
  ],
  "dominican_republic": [
    [
      "Juan",
      "Jose",
      "Luis",
      "Carlos",
      "Miguel",
      "Rafael",
      "Yordani",
      "Elvis"
    ],
    [
      "Garcia",
      "Rodriguez",
      "Martinez",
      "Perez",
      "Hernandez",
      "Sanchez",
      "Reyes",
      "Diaz"
    ]
  ],
  "puerto_rico": [
    [
      "Jose",
      "Luis",
      "Carlos",
      "Miguel",
      "Angel",
      "Javier",
      "Rafael",
      "Hector"
    ],
    [
      "Rivera",
      "Rodriguez",
      "Santiago",
      "Torres",
      "Martinez",
      "Ortiz",
      "Morales",
      "Cruz"
    ]
  ],
  "costa_rica": [
    [
      "Jose",
      "Juan",
      "Carlos",
      "Luis",
      "Andres",
      "Diego",
      "Bryan",
      "Kevin"
    ],
    [
      "Rodriguez",
      "Vargas",
      "Jimenez",
      "Mora",
      "Rojas",
      "Alvarado",
      "Castro",
      "Sanchez"
    ]
  ],
  "panama": [
    [
      "Jose",
      "Luis",
      "Carlos",
      "Miguel",
      "Ricardo",
      "Javier",
      "Roberto",
      "Edwin"
    ],
    [
      "Rodriguez",
      "Gonzalez",
      "Martinez",
      "Perez",
      "Sanchez",
      "Castillo",
      "Herrera",
      "Moreno"
    ]
  ],
  "nicaragua": [
    [
      "Jose",
      "Carlos",
      "Luis",
      "Miguel",
      "Juan",
      "Oscar",
      "Elmer",
      "Ernesto"
    ],
    [
      "Lopez",
      "Garcia",
      "Martinez",
      "Perez",
      "Hernandez",
      "Gutierrez",
      "Mendoza",
      "Solis"
    ]
  ],
  "honduras": [
    [
      "Jose",
      "Luis",
      "Carlos",
      "Miguel",
      "Juan",
      "Bryan",
      "Kevin",
      "Edwin"
    ],
    [
      "Lopez",
      "Hernandez",
      "Martinez",
      "Garcia",
      "Mejia",
      "Rodriguez",
      "Flores",
      "Cruz"
    ]
  ],
  "guatemala": [
    [
      "Jose",
      "Carlos",
      "Luis",
      "Miguel",
      "Juan",
      "Diego",
      "Bryan",
      "Edgar"
    ],
    [
      "Garcia",
      "Lopez",
      "Hernandez",
      "Martinez",
      "Perez",
      "Gonzalez",
      "Ramirez",
      "Morales"
    ]
  ],
  "el_salvador": [
    [
      "Jose",
      "Carlos",
      "Luis",
      "Miguel",
      "Oscar",
      "Juan",
      "Kevin",
      "Bryan"
    ],
    [
      "Hernandez",
      "Martinez",
      "Garcia",
      "Lopez",
      "Perez",
      "Ramirez",
      "Flores",
      "Rivera"
    ]
  ],
  "haiti": [
    [
      "Jean",
      "Pierre",
      "Jacques",
      "Michel",
      "Frantz",
      "Wilner",
      "Daniel",
      "Patrick"
    ],
    [
      "Jean-Baptiste",
      "Joseph",
      "Pierre",
      "Louis",
      "Charles",
      "Etienne",
      "Michel",
      "Augustin"
    ]
  ],
  "jamaica": [
    [
      "Andre",
      "Dwayne",
      "Ricardo",
      "Shane",
      "Omar",
      "Devon",
      "Tyrone",
      "Marvin"
    ],
    [
      "Brown",
      "Williams",
      "Johnson",
      "Campbell",
      "Clarke",
      "Thompson",
      "Reid",
      "Robinson"
    ]
  ],
  "trinidad_and_tobago": [
    [
      "Kieron",
      "Darren",
      "Jason",
      "Akeem",
      "Kevon",
      "Nicholas",
      "Shannon",
      "Rondell"
    ],
    [
      "Mohammed",
      "Williams",
      "Ramkissoon",
      "Singh",
      "Baptiste",
      "Charles",
      "Joseph",
      "George"
    ]
  ],
  "egypt": [
    [
      "Mohamed",
      "Ahmed",
      "Mahmoud",
      "Mostafa",
      "Omar",
      "Hassan",
      "Youssef",
      "Ibrahim"
    ],
    [
      "Mohamed",
      "Ahmed",
      "Hassan",
      "Ali",
      "Mahmoud",
      "Ibrahim",
      "Sayed",
      "Fathy"
    ]
  ],
  "morocco": [
    [
      "Youssef",
      "Mohamed",
      "Ayoub",
      "Mehdi",
      "Hamza",
      "Omar",
      "Rachid",
      "Karim"
    ],
    [
      "El Amrani",
      "Bennani",
      "Alaoui",
      "Fassi",
      "Haddad",
      "Berrada",
      "Naciri",
      "Tazi"
    ]
  ],
  "algeria": [
    [
      "Mohamed",
      "Youcef",
      "Abdelkader",
      "Karim",
      "Sofiane",
      "Rachid",
      "Nabil",
      "Samir"
    ],
    [
      "Benali",
      "Bouzid",
      "Hamdi",
      "Mansouri",
      "Saidi",
      "Belkacem",
      "Ziani",
      "Amrani"
    ]
  ],
  "tunisia": [
    [
      "Mohamed",
      "Ahmed",
      "Youssef",
      "Anis",
      "Walid",
      "Sami",
      "Nizar",
      "Mehdi"
    ],
    [
      "Trabelsi",
      "Ben Salah",
      "Jebali",
      "Mansouri",
      "Gharbi",
      "Ayari",
      "Khelifi",
      "Mejri"
    ]
  ],
  "israel": [
    [
      "Noam",
      "Ariel",
      "Eitan",
      "Daniel",
      "Yonatan",
      "Itai",
      "Nadav",
      "Omer"
    ],
    [
      "Cohen",
      "Levi",
      "Mizrahi",
      "Peretz",
      "Biton",
      "Avraham",
      "Friedman",
      "Katz"
    ]
  ],
  "libya": [
    [
      "Mohamed",
      "Ahmed",
      "Ali",
      "Fathi",
      "Khaled",
      "Youssef",
      "Salem",
      "Nasser"
    ],
    [
      "El-Masri",
      "Al-Fituri",
      "Al-Mahdi",
      "Al-Tarhuni",
      "Ben Salem",
      "Al-Gaddafi",
      "Al-Senussi",
      "Al-Obeidi"
    ]
  ],
  "ghana": [
    [
      "Kwame",
      "Kofi",
      "Yaw",
      "Kojo",
      "Mensah",
      "Nana",
      "Kwesi",
      "Kweku"
    ],
    [
      "Mensah",
      "Owusu",
      "Boateng",
      "Appiah",
      "Asante",
      "Osei",
      "Addo",
      "Agyemang"
    ]
  ],
  "uganda": [
    [
      "Moses",
      "Joseph",
      "Isaac",
      "David",
      "Samuel",
      "Brian",
      "Patrick",
      "Emmanuel"
    ],
    [
      "Kato",
      "Okello",
      "Mugisha",
      "Sserwadda",
      "Kizza",
      "Nsubuga",
      "Tumusiime",
      "Wasswa"
    ]
  ],
  "tanzania": [
    [
      "Juma",
      "Hassan",
      "Ali",
      "Omari",
      "Rajabu",
      "Joseph",
      "Emmanuel",
      "Musa"
    ],
    [
      "Msuya",
      "Mwinyi",
      "Mosha",
      "Mollel",
      "Komba",
      "Mwaniki",
      "Ndunguru",
      "Kassim"
    ]
  ],
  "cameroon": [
    [
      "Jean",
      "Samuel",
      "Cedric",
      "Patrick",
      "Eric",
      "Andre",
      "Emmanuel",
      "Alain"
    ],
    [
      "Nkomo",
      "Tchoua",
      "Fouda",
      "Mbarga",
      "Essomba",
      "Njoya",
      "Manga",
      "Abanda"
    ]
  ],
  "senegal": [
    [
      "Mamadou",
      "Cheikh",
      "Ousmane",
      "Ibrahima",
      "Lamine",
      "Abdou",
      "Moussa",
      "Pape"
    ],
    [
      "Diop",
      "Ndiaye",
      "Sow",
      "Fall",
      "Sarr",
      "Gueye",
      "Ba",
      "Faye"
    ]
  ],
  "angola": [
    [
      "Joao",
      "Manuel",
      "Antonio",
      "Jose",
      "Paulo",
      "Miguel",
      "Carlos",
      "Mateus"
    ],
    [
      "Silva",
      "Santos",
      "Manuel",
      "Costa",
      "Afonso",
      "Domingos",
      "Mateus",
      "Fernandes"
    ]
  ],
  "mozambique": [
    [
      "Joao",
      "Manuel",
      "Jose",
      "Antonio",
      "Carlos",
      "Paulo",
      "Mateus",
      "Nelson"
    ],
    [
      "Mabunda",
      "Mucavele",
      "Nhantumbo",
      "Chissano",
      "Macamo",
      "Sitoe",
      "Mondlane",
      "Ndlovu"
    ]
  ],
  "zimbabwe": [
    [
      "Tendai",
      "Tafadzwa",
      "Blessing",
      "Farai",
      "Tatenda",
      "Simba",
      "Tinashe",
      "Kudakwashe"
    ],
    [
      "Moyo",
      "Ncube",
      "Sibanda",
      "Dube",
      "Mpofu",
      "Ndlovu",
      "Chuma",
      "Mutasa"
    ]
  ],
  "zambia": [
    [
      "Moses",
      "Joseph",
      "Kelvin",
      "Brian",
      "Emmanuel",
      "Chanda",
      "Bwalya",
      "Mutale"
    ],
    [
      "Banda",
      "Phiri",
      "Mulenga",
      "Mbewe",
      "Tembo",
      "Chileshe",
      "Mwansa",
      "Sakala"
    ]
  ],
  "dr_congo": [
    [
      "Jean",
      "Patrick",
      "Cedric",
      "Amani",
      "Dieumerci",
      "Fabrice",
      "Joel",
      "Tresor"
    ],
    [
      "Kabila",
      "Mwamba",
      "Ilunga",
      "Kabongo",
      "Mutombo",
      "Mulumba",
      "Tshibangu",
      "Kalala"
    ]
  ],
  "cote_d_ivoire": [
    [
      "Kouadio",
      "Yao",
      "Koffi",
      "Adama",
      "Ibrahim",
      "Moussa",
      "Serge",
      "Didier"
    ],
    [
      "Kouassi",
      "Kone",
      "Toure",
      "Bamba",
      "Traore",
      "Yao",
      "Koffi",
      "Coulibaly"
    ]
  ],
  "mali": [
    [
      "Moussa",
      "Amadou",
      "Ibrahim",
      "Oumar",
      "Bakary",
      "Seydou",
      "Modibo",
      "Lassana"
    ],
    [
      "Keita",
      "Traore",
      "Coulibaly",
      "Diarra",
      "Toure",
      "Cisse",
      "Kone",
      "Sissoko"
    ]
  ],
  "burkina_faso": [
    [
      "Moussa",
      "Issa",
      "Adama",
      "Oumar",
      "Boukary",
      "Souleymane",
      "Abdoulaye",
      "Seydou"
    ],
    [
      "Ouedraogo",
      "Kaboré",
      "Traoré",
      "Sawadogo",
      "Compaoré",
      "Zongo",
      "Ilboudo",
      "Sanou"
    ]
  ],
  "nigeria": [
    [
      "Chinedu",
      "Emeka",
      "Ifeanyi",
      "Tunde",
      "Ayo",
      "Musa",
      "Ibrahim",
      "Kelvin"
    ],
    [
      "Okafor",
      "Okoro",
      "Nwosu",
      "Adebayo",
      "Adeyemi",
      "Bello",
      "Balogun",
      "Eze"
    ]
  ],
  "south_africa": [
    [
      "Thabo",
      "Sipho",
      "Mandla",
      "Sibusiso",
      "Themba",
      "Kagiso",
      "Lungile",
      "Bongani"
    ],
    [
      "Mokoena",
      "Dlamini",
      "Ndlovu",
      "Khumalo",
      "Mthembu",
      "Naidoo",
      "Pillay",
      "Botha"
    ]
  ],
  "kenya": [
    [
      "Brian",
      "David",
      "Joseph",
      "Daniel",
      "Peter",
      "Collins",
      "Dennis",
      "Kevin"
    ],
    [
      "Otieno",
      "Mwangi",
      "Kiptoo",
      "Ochieng",
      "Kamau",
      "Njoroge",
      "Mutua",
      "Wanyama"
    ]
  ],
  "ethiopia": [
    [
      "Abel",
      "Dawit",
      "Yonas",
      "Samuel",
      "Mekonnen",
      "Tadesse",
      "Getachew",
      "Solomon"
    ],
    [
      "Bekele",
      "Tesfaye",
      "Alemu",
      "Kebede",
      "Haile",
      "Tadesse",
      "Gebre",
      "Mengistu"
    ]
  ]
};

  var NAME_SCHEMA_VERSION = "names-v5-country-packs-8x8";

  function uniqueList(list) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (item) {
      item = String(item || "").trim();
      if (!item || seen[item.toLowerCase()]) { return; }
      seen[item.toLowerCase()] = true;
      out.push(item);
    });
    return out;
  }

  function localNamePack(country) {
    var id = country && country.id ? country.id : "";
    var group = country && (country.localPoolId || country.continentId) ? (country.localPoolId || country.continentId) : "";
    var packs = {
      slavic: {
        first: ["Aleksandr","Dmitry","Ivan","Mikhail","Sergey","Nikita","Artem","Kirill","Pavel","Roman","Andrei","Viktor","Yuri","Maxim","Ilya","Danil","Egor","Oleg","Lev","Ruslan","Vladislav","Timur","Anton","Denis","Gleb","Nikolai","Matvey","Fedor","Stepan","Konstantin"],
        last: ["Ivanov","Smirnov","Kuznetsov","Popov","Volkov","Sokolov","Morozov","Orlov","Pavlov","Fedorov","Mikhailov","Novikov","Egorov","Lebedev","Kozlov","Zaitsev","Karpov","Belyaev","Tarasov","Komarov","Gusev","Romanov","Nikiforov","Sobolev","Chernov","Krylov","Baranov","Savin","Makarov","Grachev"]
      },
      latin: {
        first: ["Jose","Juan","Luis","Carlos","Miguel","Jorge","Ricardo","Fernando","Diego","Santiago","Emiliano","Mateo","Nicolas","Andres","Rafael","Gabriel","Hector","Mario","Francisco","Manuel","Eduardo","Pablo","Tomas","Ignacio","Sebastian","Adrian","Julian","Raul","Oscar","Victor"],
        last: ["Hernandez","Garcia","Martinez","Lopez","Gonzalez","Rodriguez","Perez","Sanchez","Ramirez","Torres","Flores","Rivera","Gomez","Diaz","Cruz","Morales","Ortiz","Vargas","Castillo","Romero","Rojas","Mendoza","Aguilar","Navarro","Silva","Molina","Vega","Campos","Paredes","Valdez"]
      },
      anglo: {
        first: ["James","Michael","Robert","John","David","William","Anthony","Daniel","Thomas","Ryan","Jason","Marcus","Ethan","Lucas","Mason","Logan","Owen","Noah","Liam","Jack","Connor","Dylan","Tyler","Aaron","Brandon","Caleb","Isaac","Nathan","Austin","Jordan"],
        last: ["Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Wilson","Anderson","Taylor","Thomas","Moore","Martin","Jackson","Thompson","White","Harris","Clark","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Green","Baker","Adams","Nelson"]
      },
      germanic: {
        first: ["Maximilian","Lukas","Leon","Felix","Jonas","Paul","Tobias","Florian","Jan","Noah","Finn","Elias","Oskar","Nils","Erik","Mats","Daan","Bram","Luuk","Jesse","Milan","Lars","Viktor","Gustav","Axel","Emil","Frederik","Rasmus","Kasper","Sander"],
        last: ["Muller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Hoffmann","Schulz","Bauer","Klein","Richter","Wolf","Neumann","Zimmermann","Jansen","De Vries","Bakker","Visser","Smit","Andersson","Johansson","Karlsson","Nielsen","Hansen","Pedersen","Larsen","Berg","Olsen"]
      },
      east_asia: {
        first: ["Haruto","Yuto","Sota","Ren","Daiki","Kaito","Riku","Takumi","Minjun","Seojun","Jihoon","Hyunwoo","Jisung","Taeyang","Donghyun","Wei","Jun","Lei","Ming","Hao","Jian","Tao","Qiang","Yuki","Kenta","Sho","Tatsuya","Hiroki","Kenji","Ryota"],
        last: ["Sato","Suzuki","Takahashi","Tanaka","Watanabe","Ito","Yamamoto","Nakamura","Kobayashi","Kato","Kim","Lee","Park","Choi","Jung","Kang","Cho","Yoon","Wang","Li","Zhang","Liu","Chen","Yang","Huang","Zhao","Zhou","Wu","Xu","Sun"]
      },
      central_asia: {
        first: ["Alikhan","Daniyar","Aidos","Bekzat","Timur","Askar","Yerlan","Sardor","Bekzod","Jasur","Aziz","Doston","Shakhzod","Oybek","Alisher","Baatar","Temuulen","Enkhbayar","Munkh","Tugsbayar","Ganbold","Altan","Ruslan","Nurlan","Dias","Arman","Marat","Eldar","Sanjar","Iskander"],
        last: ["Nurmagambetov","Sarsenov","Akhmetov","Tulegenov","Iskakov","Orazov","Karimov","Tursunov","Rakhimov","Yusupov","Ismailov","Khalilov","Nazarov","Saidov","Batbold","Ganbaatar","Enkhbold","Munkhbat","Erdenebat","Davaajav","Ospanov","Abdullayev","Kadyrov","Suleimenov","Muratov","Kasimov","Beketov","Aitmatov","Sharipov","Usmanov"]
      },
      arabic: {
        first: ["Ali","Ahmed","Hassan","Omar","Mohammed","Mustafa","Yasir","Khalid","Fahad","Abdullah","Nasser","Yousef","Turki","Rashid","Saeed","Mansour","Hamad","Sultan","Jassim","Saad","Fadi","Mahmoud","Tarek","Nabil","Yazan","Laith","Anas","Zaid","Bilal","Hamza"],
        last: ["Khan","Ahmed","Hussain","Malik","Raza","Iqbal","Al-Hassan","Al-Ali","Al-Saadi","Al-Tamimi","Karim","Salim","Al-Qahtani","Al-Otaibi","Al-Harbi","Al-Dosari","Al-Ghamdi","Al-Mansouri","Al-Hammadi","Al-Nuaimi","Al-Kuwari","Al-Marri","Al-Hajri","Darwish","Khalil","Nasser","Saleh","Haddad","Mansour","Awad"]
      },
      african: {
        first: ["Kwame","Kofi","Yaw","Kojo","Musa","Amadou","Ibrahim","Ousmane","Mamadou","Cheikh","Lamine","Joseph","Emmanuel","Samuel","Daniel","Peter","Abel","Isaac","David","Patrick","Jean","Cedric","Amani","Tariq","Malik","Hassan","Kelvin","Brian","Victor","Francis"],
        last: ["Mensah","Owusu","Boateng","Appiah","Diallo","Traore","Keita","Diop","Ndiaye","Sow","Camara","Nwosu","Okafor","Okoro","Adebayo","Abebe","Bekele","Moyo","Dlamini","Ndlovu","Kabila","Mwamba","Ilunga","Kouassi","Kone","Toure","Bamba","Kamara","Sarr","Mbaye"]
      },
      default: {
        first: ["Alex","Victor","Daniel","Roman","Niko","Leo","Max","David","Ivan","Sam","Adam","Milan","Tomas","Lucas","Mark","Andrei","Rafael","Miguel","Arman","Karim","Omar","Kenji","Riku","Musa","Elias","Noah","Liam","Yuri","Pavel","Sergio"],
        last: ["Fighter","Stone","Cross","Vale","King","Ward","Black","Reed","Morris","Cole","Santos","Silva","Garcia","Ivanov","Sato","Kim","Khan","Ali","Mensah","Diallo","Novak","Brown","Martin","Lopez","Petrov","Orlov","Wang","Lee","Miller","Sokolov"]
      }
    };
    if (["russia","ukraine","belarus","poland","czechia","slovakia","serbia","croatia","bulgaria"].indexOf(id) !== -1 || group === "slavic") { return packs.slavic; }
    if (["mexico","argentina","brazil","cuba","spain","colombia","peru","chile","ecuador","uruguay","paraguay","bolivia","dominican_republic","puerto_rico","costa_rica","panama","nicaragua","honduras","guatemala","el_salvador","haiti"].indexOf(id) !== -1 || group === "latin") { return packs.latin; }
    if (["usa","canada","uk","ireland","australia","new_zealand","jamaica","trinidad_and_tobago"].indexOf(id) !== -1 || group === "anglo") { return packs.anglo; }
    if (["germany","netherlands","belgium","sweden","norway","denmark","finland"].indexOf(id) !== -1 || group === "germanic") { return packs.germanic; }
    if (["japan","south_korea","china","north_korea"].indexOf(id) !== -1 || group === "east_asia") { return packs.east_asia; }
    if (["kazakhstan","uzbekistan","kyrgyzstan","tajikistan","turkmenistan","mongolia"].indexOf(id) !== -1 || group === "central_asia") { return packs.central_asia; }
    if (["iran","iraq","saudi_arabia","uae","qatar","syria","jordan","egypt","morocco","algeria","tunisia","israel","libya"].indexOf(id) !== -1 || group === "arabic") { return packs.arabic; }
    if (["ghana","uganda","tanzania","cameroon","senegal","angola","mozambique","zimbabwe","zambia","dr_congo","cote_d_ivoire","mali","burkina_faso","nigeria","south_africa","kenya","ethiopia"].indexOf(id) !== -1 || group === "african") { return packs.african; }
    return packs.default;
  }


  function countryNamePool(country) {
    var override = COUNTRY_NAME_OVERRIDES[country.id];
    var local = localNamePack(country);
    var first = [];
    var last = [];
    var total = (Number(country.amateurCount) || 0) + (Number(country.streetCount) || 0) + (Number(country.proCount) || 0);

    if (override) {
      first = uniqueList((override[0] || []).slice());
      last = uniqueList((override[1] || []).slice());

      if (total >= 260) {
        first = uniqueList(first.concat(country.firstNames || []));
        last = uniqueList(last.concat(country.lastNames || []));
      }

      while (first.length < 8) { first.push((local.first || ["Alex"])[first.length % local.first.length] + String.fromCharCode(65 + (first.length % 26))); }
      while (last.length < 8) { last.push((local.last || ["Fighter"])[last.length % local.last.length] + String.fromCharCode(65 + (last.length % 26))); }

      return { firstNames: first, lastNames: last };
    }

    first = first.concat(country.firstNames || [], local.first || []);
    last = last.concat(country.lastNames || [], local.last || []);
    first = uniqueList(first);
    last = uniqueList(last);
    while (first.length < 8) { first.push((local.first || ["Alex"])[first.length % local.first.length] + String.fromCharCode(65 + (first.length % 26))); }
    while (last.length < 8) { last.push((local.last || ["Fighter"])[last.length % local.last.length] + String.fromCharCode(65 + (last.length % 26))); }
    return { firstNames: first, lastNames: last };
  }


  function countrySpecificName(country, seed) {
    var pool = countryNamePool(country);
    var firstNames = pool.firstNames && pool.firstNames.length ? pool.firstNames : ["Alex"];
    var lastNames = pool.lastNames && pool.lastNames.length ? pool.lastNames : ["Fighter"];
    var firstIndex = U.randomInt(0, firstNames.length - 1);
    var lastIndex = U.randomInt(0, lastNames.length - 1);
    var first = firstNames[firstIndex];
    var last = lastNames[lastIndex];
    var guard = 0;

    while (firstNames.length > 1 && lastNames.length > 1 && first === last && guard < 6) {
      lastIndex = U.randomInt(0, lastNames.length - 1);
      last = lastNames[lastIndex];
      guard += 1;
    }

    return first + " " + last;
  }


  function suggestNameForCountry(countryId, seed) {
    return countrySpecificName(U.findCountry(countryId), seed || U.randomInt(1, 999999));
  }

  function emptyRecord() {
    return { wins: 0, losses: 0, draws: 0, kos: 0 };
  }

  function cloneRecord(record) {
    var safe = record || emptyRecord();
    return {
      wins: Number(safe.wins) || 0,
      losses: Number(safe.losses) || 0,
      draws: Number(safe.draws) || 0,
      kos: Number(safe.kos) || 0
    };
  }

  function ensureTrackRecords(fighter) {
    if (!fighter.trackRecords || typeof fighter.trackRecords !== "object") {
      fighter.trackRecords = {
        amateur: emptyRecord(),
        street: emptyRecord(),
        pro: emptyRecord()
      };
    }
    fighter.trackRecords.amateur = cloneRecord(fighter.trackRecords.amateur);
    fighter.trackRecords.street = cloneRecord(fighter.trackRecords.street);
    fighter.trackRecords.pro = cloneRecord(fighter.trackRecords.pro);

    if (fighter.trackId && fighter.record) {
      fighter.trackRecords[fighter.trackId] = cloneRecord(fighter.record);
    }
  }

  function setActiveRecord(fighter, trackId) {
    ensureTrackRecords(fighter);
    fighter.trackRecords[fighter.trackId] = cloneRecord(fighter.record);
    fighter.record = cloneRecord(fighter.trackRecords[trackId] || emptyRecord());
  }

  function rankForFighter(fighter) {
    var rating = U.statAverage(fighter.stats);
    var ranks = Data.amateurRanks;
    var i;
    var best = ranks[0];

    for (i = 0; i < ranks.length; i += 1) {
      if (rating >= ranks[i].minRating && rating <= ranks[i].maxRating) {
        return ranks[i];
      }
      if (rating >= ranks[i].minRating) {
        best = ranks[i];
      }
    }

    return best;
  }

  function baseForRank(rankId) {
    var i;
    for (i = 0; i < Data.amateurRanks.length; i += 1) {
      if (Data.amateurRanks[i].id === rankId) {
        return U.randomInt(Data.amateurRanks[i].minRating, Data.amateurRanks[i].maxRating);
      }
    }
    return 30;
  }

  function recordByTrackAndRating(trackId, rating, rankId, age) {
    var wins;
    var losses;
    var draws;
    var koRate;
    var maxTotal;
    var total;
    var scale;
    var minKoRate;
    var maxKoRate;

    if (trackId === "pro") {
      if (rating >= 180) { wins = U.randomInt(28, 45); losses = U.randomInt(0, 2); }
      else if (rating >= 155) { wins = U.randomInt(21, 38); losses = U.randomInt(0, 4); }
      else if (rating >= 125) { wins = U.randomInt(14, 30); losses = U.randomInt(1, 7); }
      else if (rating >= 105) { wins = U.randomInt(7, 20); losses = U.randomInt(2, 10); }
      else { wins = U.randomInt(0, 10); losses = U.randomInt(0, 6); }
      minKoRate = 0.40;
      maxKoRate = 0.80;
      maxTotal = Math.max(0, (age || 18) - 17) * 8;
    } else if (trackId === "street") {
      if (rating >= 130) { wins = U.randomInt(55, 150); losses = U.randomInt(2, 18); }
      else if (rating >= 100) { wins = U.randomInt(30, 105); losses = U.randomInt(6, 38); }
      else if (rating >= 65) { wins = U.randomInt(12, 65); losses = U.randomInt(8, 55); }
      else if (rating >= 30) { wins = U.randomInt(4, 35); losses = U.randomInt(5, 45); }
      else { wins = U.randomInt(0, 14); losses = U.randomInt(0, 22); }
      minKoRate = 0.50;
      maxKoRate = 0.90;
      maxTotal = Math.max(12, ((age || 18) - 16) * 18);
    } else {
      if (rankId === "msmk" || rating >= 100) { wins = U.randomInt(75, 165); losses = U.randomInt(3, 25); }
      else if (rankId === "ms" || rating >= 80) { wins = U.randomInt(50, 130); losses = U.randomInt(7, 38); }
      else if (rankId === "kms" || rating >= 60) { wins = U.randomInt(28, 85); losses = U.randomInt(10, 48); }
      else if (rankId === "adult_1" || rating >= 40) { wins = U.randomInt(12, 48); losses = U.randomInt(8, 42); }
      else if (rankId === "adult_2" || rating >= 20) { wins = U.randomInt(4, 28); losses = U.randomInt(5, 34); }
      else { wins = U.randomInt(0, 14); losses = U.randomInt(0, 20); }
      minKoRate = 0.10;
      maxKoRate = 0.30;
      maxTotal = Math.max(12, 34 + Math.max(0, (age || 18) - 18) * 18);
    }

    draws = U.randomInt(0, Math.min(8, Math.floor((wins + losses) / 20)));
    total = wins + losses + draws;

    if (total > maxTotal) {
      scale = maxTotal / total;
      wins = Math.max(0, Math.floor(wins * scale));
      losses = Math.max(0, Math.floor(losses * scale));
      draws = Math.max(0, Math.min(6, maxTotal - wins - losses));
    }

    koRate = U.randomInt(Math.round(minKoRate * 100), Math.round(maxKoRate * 100)) / 100;

    return {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: Math.max(0, Math.min(wins, Math.round(wins * koRate)))
    };
  }

  function clampFighterStats(fighter) {
    var keys = ["power", "technique", "speed", "stamina", "defense", "health"];
    var i;
    if (!fighter || !fighter.stats) { return; }
    for (i = 0; i < keys.length; i += 1) {
      if (fighter.stats[keys[i]] != null) {
        fighter.stats[keys[i]] = U.clamp(Math.round(Number(fighter.stats[keys[i]]) || 1), 1, 200);
      }
    }
  }

  

  function createRecord(seed) {
    return recordByTrackAndRating("amateur", Math.abs(seed) % 100, "", 18);
  }

  function createFighter(countryId, trackId, seed, baseValue, options) {
    var country = U.findCountry(countryId);
    var opts = options || {};
    var weightClassId = trackId === "street" ? "" : (opts.weightClassId || Data.weightClasses[Math.abs(seed) % Data.weightClasses.length].id);
    var stanceId = opts.stanceId || "";
    var age = typeof opts.age === "number" ? opts.age : U.clamp(18 + (Math.abs(seed) % 18), 18, 42);
    var stats = opts.stats || U.createStats(trackId, U.clamp(baseValue, 1, 200));
    Object.keys(stats).forEach(function (key) { stats[key] = U.clamp(Math.round(Number(stats[key]) || 1), 1, 200); });
    var rankId = opts.rankId || "";
    var record = opts.record || recordByTrackAndRating(trackId, U.statAverage(stats), rankId, age);
    var fighter = {
      id: opts.id || U.uid("fighter"),
      name: opts.name || countrySpecificName(country, seed),
      countryId: countryId,
      nameCountryId: opts.nameCountryId || countryId,
      homeCountryId: opts.homeCountryId || countryId,
      currentCountryId: opts.currentCountryId || countryId,
      trackId: trackId,
      weightClassId: weightClassId,
      stanceId: stanceId,
      age: age,
      gymId: opts.gymId || "",
      stats: stats,
      record: cloneRecord(record),
      trackRecords: opts.trackRecords || { amateur: emptyRecord(), street: emptyRecord(), pro: emptyRecord() },
      isPlayer: !!opts.isPlayer,
      known: !!opts.known,
      hasGonePro: trackId === "pro" || !!opts.hasGonePro,
      proClosed: !!opts.proClosed,
      titles: opts.titles || [],
      awards: opts.awards || [],
      careerLog: opts.careerLog || [],
      storyFlags: opts.storyFlags || [],
      trainingPoints: opts.trainingPoints || 0,
      money: Number(opts.money) || 0,
      fatigue: Number(opts.fatigue) || 0,
      equipment: opts.equipment || {},
      financeLog: opts.financeLog instanceof Array ? opts.financeLog : [],
      monthlyExpenseLog: opts.monthlyExpenseLog instanceof Array ? opts.monthlyExpenseLog : [],
      lastExpenseWeek: opts.lastExpenseWeek || 1,
      birthMonth: opts.birthMonth || U.randomInt(1, 12),
      birthWeek: opts.birthWeek || U.randomInt(1, 4),
      retired: !!opts.retired,
      retiredWeek: opts.retiredWeek || 0,
      retiredReason: opts.retiredReason || "",
      memorial: opts.memorial || null,
      recentOpponentIds: opts.recentOpponentIds instanceof Array ? opts.recentOpponentIds : [],
      nextFightWeek: opts.nextFightWeek || 0,
      contractOpponentId: opts.contractOpponentId || "",
      contractLabel: opts.contractLabel || "",
      contractPurse: Number(opts.contractPurse) || 0,
      contractRounds: Number(opts.contractRounds) || 0,
      contractId: opts.contractId || "",
      promoterId: opts.promoterId || "",
      expenseMultiplier: Number(opts.expenseMultiplier) || 1,
      hardModeDebt: !!opts.hardModeDebt,
      archetypeId: opts.archetypeId || "",
      lastMoveWeek: 1,
      lastFightWeek: 0,
      seed: seed
    };

    fighter.trackRecords[trackId] = cloneRecord(record);
    updateDerivedFighterFields(fighter);
    return fighter;
  }

  function scaledBaseForAmateurIndex(index, total) {
    var ratio = total > 1 ? index / (total - 1) : 0;
    if (ratio > 0.997) { return U.randomInt(100, 120); }
    if (ratio > 0.985) { return U.randomInt(85, 105); }
    if (ratio > 0.94) { return U.randomInt(65, 90); }
    if (ratio > 0.74) { return U.randomInt(42, 68); }
    if (ratio > 0.42) { return U.randomInt(22, 48); }
    return U.randomInt(0, 28);
  }

  function rankForBaseValue(value) {
    if (value >= 100) { return "msmk"; }
    if (value >= 80) { return "ms"; }
    if (value >= 60) { return "kms"; }
    if (value >= 40) { return "adult_1"; }
    if (value >= 20) { return "adult_2"; }
    return "adult_3";
  }

  function distributeCount(total, buckets) {
    var result = [];
    var i;
    var used = 0;
    for (i = 0; i < buckets; i += 1) {
      result[i] = Math.floor(total / buckets);
      used += result[i];
    }
    i = 0;
    while (used < total) {
      result[i % buckets] += 1;
      used += 1;
      i += 1;
    }
    return result;
  }

  function foreignOriginCountry(hostCountry, seed, trackId, index, count) {
    var chance = trackId === "street" ? 7 : 5;
    var pool;
    var origin;
    if (trackId !== "pro" && count >= 12 && index === 0) { chance = Math.max(chance, 100); }
    if (U.randomInt(1, 100) > chance) { return hostCountry; }

    pool = Data.countries.filter(function (country) {
      if (country.id === hostCountry.id) { return false; }
      if (hostCountry.localPoolId && country.localPoolId === hostCountry.localPoolId) { return true; }
      return country.continentId === hostCountry.continentId;
    });

    if (!pool.length) {
      pool = Data.countries.filter(function (country) { return country.id !== hostCountry.id; });
    }

    origin = pool[Math.abs(seed + index * 17) % pool.length] || hostCountry;
    return origin;
  }

  function createHostedFighter(hostCountry, trackId, seed, base, opts, index, count) {
    var originCountry = foreignOriginCountry(hostCountry, seed, trackId, index || 0, count || 0);
    var fighter = createFighter(originCountry.id, trackId, seed, base, Object.assign({}, opts || {}, {
      homeCountryId: originCountry.id,
      currentCountryId: hostCountry.id
    }));
    fighter.countryId = hostCountry.id;
    fighter.currentCountryId = hostCountry.id;
    fighter.originCountryId = originCountry.id;
    fighter.isForeignResident = originCountry.id !== hostCountry.id;
    return fighter;
  }

  function createRoster(player) {
    var roster = [];
    var countryIndex;
    var weightIndex;
    var fighterIndex;
    var country;
    var countryId;
    var weightClassId;
    var seed;
    var base;
    var count;
    var perWeight;
    var rankId;

    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      country = Data.countries[countryIndex];
      countryId = country.id;
      perWeight = distributeCount(Number(country.proCount) || 0, Data.weightClasses.length);
      for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
        weightClassId = Data.weightClasses[weightIndex].id;
        for (fighterIndex = 0; fighterIndex < perWeight[weightIndex]; fighterIndex += 1) {
          seed = 100000 + countryIndex * 10000 + weightIndex * 1000 + fighterIndex;
          count = Math.max(1, perWeight[weightIndex]);
          base = U.clamp(90 + Math.round((fighterIndex / count) * 110) + U.randomInt(-5, 5), 90, 200);
          roster.push(createHostedFighter(country, "pro", seed, base, {
            weightClassId: weightClassId,
            age: U.randomInt(19, 39)
          }, fighterIndex + weightIndex * 100, count));
        }
      }
    }

    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      country = Data.countries[countryIndex];
      count = Number(country.streetCount) || 0;
      for (fighterIndex = 0; fighterIndex < count; fighterIndex += 1) {
        seed = 200000 + countryIndex * 10000 + fighterIndex;
        base = U.clamp(Math.round((fighterIndex / Math.max(1, count - 1)) * 150) + U.randomInt(-6, 6), 0, 150);
        roster.push(createHostedFighter(country, "street", seed, base, {
          weightClassId: "",
          age: U.randomInt(18, 45)
        }, fighterIndex, count));
      }
    }

    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      country = Data.countries[countryIndex];
      count = Number(country.amateurCount) || 0;
      for (fighterIndex = 0; fighterIndex < count; fighterIndex += 1) {
        seed = 300000 + countryIndex * 100000 + fighterIndex;
        base = scaledBaseForAmateurIndex(fighterIndex, count);
        rankId = rankForBaseValue(base);
        weightClassId = Data.weightClasses[(fighterIndex + countryIndex) % Data.weightClasses.length].id;
        roster.push(createHostedFighter(country, "amateur", seed, base, {
          weightClassId: weightClassId,
          rankId: rankId,
          age: U.randomInt(18, 30)
        }, fighterIndex, count));
      }
    }

    roster.push(player);
    return roster;
  }

  function createPeople(countryId) {
    return [];
  }

  function archetypeById(id) {
    var list = Data.careerArchetypes || [];
    return list.find(function (item) { return item.id === id; }) || list[1] || { id: "amateur", age: 18, baseOvr: 30, trackId: "amateur", money: 250, fatigue: 8 };
  }

  function flatStats(value) {
    var v = Math.max(0, Math.round(Number(value) || 0));
    return { power: v, technique: v, speed: v, stamina: v, defense: v };
  }

  function createCareer(payload) {
    var archetype = archetypeById(payload.archetypeId);
    var trackId = U.findTrack(archetype.trackId || payload.trackId || "amateur").id;
    var countryId = U.findCountry(payload.countryId).id;
    var weightClassId = U.findWeightClass(payload.weightClassId).id;
    var startingStats = flatStats(archetype.baseOvr);
    var player = createFighter(countryId, trackId, 777, archetype.baseOvr, {
      id: "player",
      name: payload.name || suggestNameForCountry(countryId, Date.now()),
      isPlayer: true,
      known: true,
      homeCountryId: countryId,
      currentCountryId: countryId,
      weightClassId: trackId === "street" ? "" : weightClassId,
      stanceId: "",
      age: archetype.age || 18,
      stats: startingStats,
      record: emptyRecord(),
      trackRecords: { amateur: emptyRecord(), street: emptyRecord(), pro: emptyRecord() },
      trainingPoints: 0,
      money: Number(archetype.money) || 0,
      fatigue: Number(archetype.fatigue) || 0,
      equipment: {},
      financeLog: [],
      monthlyExpenseLog: [],
      lastExpenseWeek: 1,
      archetypeId: archetype.id,
      expenseMultiplier: archetype.expenseMultiplier || 1,
      hardModeDebt: !!archetype.hardModeDebt,
      promoterId: archetype.trackId === "pro" ? "local_hall" : "",
      careerLog: [{ week: 1, text: "Начало карьеры: " + archetype.label + "." }]
    });

    var state = {
      version: Data.appVersion,
      week: 1,
      selectedTab: "dashboard",
      playerId: player.id,
      rankingCountryId: countryId,
      rankingTrackId: trackId,
      rankingWeightClassId: weightClassId,
      rankingPage: 0,
      modal: null,
      roster: [],
      people: [],
      offers: [],
      offerRefreshSalt: 0,
      trackedFighterIds: [],
      clubs: [],
      titles: {},
      amateurPath: { completed: {}, medals: [], lastCompetitionWeekById: {}, points: 0 },
      world: { news: [], weekReports: [], teamsByCountry: {}, transitionLog: [], stories: [], memorials: [], nationalTeamQualification: {}, reserveAdditions: {}, proContracts: [], proContractHistory: [], tournamentCalendar: [], pendingTournamentInvite: null, pendingProFight: null },
      feed: "Карьера началась: " + archetype.label + ". Мир загружен.",
      createdAt: new Date().toISOString()
    };

    player.trackRecords[trackId] = cloneRecord(player.record);
    state.roster = createRoster(player);
    return state;
  }

  function player(state) {
    return U.getFighterById(state, state.playerId);
  }

  function syncPlayer(state) {
    var p = player(state);
    if (p) {
      p.isPlayer = true;
      p.known = true;
    }
  }

  function switchFighterTrack(state, fighter, targetTrackId, reason) {
    var target = U.findTrack(targetTrackId);
    if (!fighter || !target || fighter.trackId === target.id) {
      return false;
    }

    ensureTrackRecords(fighter);
    fighter.trackRecords[fighter.trackId] = cloneRecord(fighter.record);
    fighter.record = cloneRecord(fighter.trackRecords[target.id] || emptyRecord());

    if (fighter.trackId === "pro" && target.id === "street") {
      fighter.proClosed = true;
    }
    if (target.id === "pro") {
      fighter.hasGonePro = true;
    }

    fighter.trackId = target.id;
    if (target.id === "street") {
      fighter.weightClassId = "";
    } else if (!fighter.weightClassId) {
      fighter.weightClassId = Data.weightClasses[2].id;
    }

    fighter.gymId = "";
    fighter.lastMoveWeek = state.week;
    updateDerivedFighterFields(fighter);

    if (reason && fighter.careerLog) {
      fighter.careerLog.unshift({ week: state.week, text: reason });
    }

    return true;
  }

  function setPlayerTrack(state, trackId) {
    var p = player(state);
    var target = U.findTrack(trackId);
    var rating = p ? U.statAverage(p.stats) : 0;
    if (!p || !target) {
      return false;
    }

    if (target.id === "amateur" && rating > 100) {
      state.feed = "OVR выше 100: в любители перейти нельзя.";
      return false;
    }
    if (target.id === "street" && rating > 150) {
      state.feed = "OVR выше 150: на улицу перейти нельзя.";
      return false;
    }
    if (target.id === "pro" && rating < 90) {
      state.feed = "Для профи нужен OVR 90+.";
      return false;
    }

    if (p.trackId === "pro" && target.id === "amateur") {
      state.feed = "После старта профессиональной карьеры нельзя вернуться в любители.";
      return false;
    }

    if (p.proClosed && target.id === "pro") {
      state.feed = "После ухода из профи на улицу возвращение в профи пока закрыто.";
      return false;
    }

    if (switchFighterTrack(state, p, target.id, "Переход: " + target.label + ".")) {
      state.rankingTrackId = target.id;
      state.rankingWeightClassId = p.weightClassId || state.rankingWeightClassId;
      state.rankingPage = 0;
      state.feed = "Путь изменён: " + target.label + ". Рекорд текущего пути восстановлен отдельно.";
      return true;
    }

    return false;
  }

  function setPlayerCountry(state, countryId) {
    var country = U.findCountry(countryId);
    var p = player(state);
    var cost;
    if (!p) { return false; }
    if (p.countryId === country.id) {
      state.feed = "Ты уже находишься в этой стране.";
      return false;
    }

    cost = Data.economy && Data.economy.travelCosts ? (Data.economy.travelCosts[country.id] || 220) : 220;
    if (!spendMoney(state, cost, "Перелёт: " + country.label)) { return false; }
    adjustFatigue(state, Data.economy && Data.economy.fatigue ? Data.economy.fatigue.travel : 14, "Перелёт");
    p.countryId = country.id;
    p.currentCountryId = country.id;
    invalidateCaches(state);
    p.gymId = "";
    state.people = [];
    state.rankingCountryId = country.id;
    state.rankingPage = 0;
    state.feed = "Перелёт: " + country.label + " за $" + cost + ". Старый зал сброшен, выбери новый во вкладке “Мой клуб”.";
    p.careerLog.unshift({ week: state.week, text: "Перелёт в страну: " + country.label + " ($" + cost + ")." });
    return true;
  }

  function setPlayerWeightClass(state, weightClassId) {
    var p = player(state);
    var currentIndex;
    var targetIndex;
    var target;

    if (!p || p.trackId === "street") {
      state.feed = "На улице нет весовых категорий.";
      return false;
    }

    currentIndex = Data.weightClasses.findIndex(function (weight) { return weight.id === p.weightClassId; });
    targetIndex = Data.weightClasses.findIndex(function (weight) { return weight.id === weightClassId; });
    target = U.findWeightClass(weightClassId);

    if (currentIndex < 0 || targetIndex < 0) {
      return false;
    }

    if (currentIndex === Data.weightClasses.length - 1) {
      state.feed = "В тяжёлом весе выше переходить нельзя.";
      return false;
    }

    if (targetIndex <= currentIndex || targetIndex > currentIndex + 2) {
      state.feed = "Можно перейти только вверх и максимум на две весовые.";
      return false;
    }

    p.weightClassId = target.id;
    state.rankingWeightClassId = target.id;
    state.rankingPage = 0;
    state.feed = "Весовая категория изменена: " + target.label + ".";
    p.careerLog.unshift({ week: state.week, text: "Переход в вес: " + target.label + "." });
    return true;
  }

  function setTactic() {
    return false;
  }

  function updateDerivedFighterFields(fighter) {
    if (fighter.trackId === "amateur") {
      fighter.amateurRankId = rankForFighter(fighter).id;
    }
    if (fighter.trackId === "street") {
      fighter.weightClassId = "";
      fighter.streetRating = U.clamp(U.statAverage(fighter.stats) + Math.round(fighter.record.wins * 0.18) - Math.round(fighter.record.losses * 0.11), 1, 220);
    }
    if (fighter.trackId === "pro") {
      fighter.proRating = U.clamp(U.statAverage(fighter.stats) + Math.round(fighter.record.wins * 0.55), 1, 260);
      fighter.hasGonePro = true;
    }
  }

  function updateAllDerived(state) {
    var i;
    for (i = 0; i < state.roster.length; i += 1) {
      state.roster[i].nameCountryId = state.roster[i].nameCountryId || state.roster[i].originCountryId || state.roster[i].homeCountryId || state.roster[i].countryId;
      if (!state.roster[i].isPlayer) {
        var nameCountryId = state.roster[i].originCountryId || state.roster[i].homeCountryId || state.roster[i].countryId;
        if (state.roster[i].nameCountryId !== nameCountryId || state.roster[i].namesSchemaVersion !== NAME_SCHEMA_VERSION) {
          state.roster[i].name = countrySpecificName(U.findCountry(nameCountryId), state.roster[i].seed || i + 1);
          state.roster[i].nameCountryId = nameCountryId;
          state.roster[i].namesSchemaVersion = NAME_SCHEMA_VERSION;
        }
      }
      clampFighterStats(state.roster[i]);
      updateDerivedFighterFields(state.roster[i]);
    }
  }


  function ensurePlayerSystems(state) {
    var p = player(state);
    if (!p) { return null; }
    p.homeCountryId = p.homeCountryId || p.countryId;
    p.currentCountryId = p.countryId;
    p.money = Number(p.money);
    if (!isFinite(p.money)) { p.money = Data.economy ? Data.economy.startingMoney : 650; }
    p.fatigue = U.clamp(Number(p.fatigue) || 0, 0, 100);
    p.equipment = p.equipment && typeof p.equipment === "object" ? p.equipment : {};
    p.financeLog = p.financeLog instanceof Array ? p.financeLog : [];
    p.monthlyExpenseLog = p.monthlyExpenseLog instanceof Array ? p.monthlyExpenseLog : [];
    p.lastExpenseWeek = Number(p.lastExpenseWeek) || 1;
    p.debtStartWeek = Number(p.debtStartWeek) || 0;
    p.debtDeadlineWeek = Number(p.debtDeadlineWeek) || 0;
    return p;
  }

  function pushFinanceLog(p, state, text, amount) {
    p.financeLog = p.financeLog instanceof Array ? p.financeLog : [];
    p.financeLog.unshift({ week: state.week, text: text, amount: Number(amount) || 0 });
    if (p.financeLog.length > 30) { p.financeLog.length = 30; }
  }

  function addMoney(state, amount, reason) {
    var p = ensurePlayerSystems(state);
    var value = Math.round(Number(amount) || 0);
    if (!p || value <= 0) { return false; }
    p.money += value;
    pushFinanceLog(p, state, reason || "Доход", value);
    updateDebtStatus(state, "income");
    return true;
  }

  function spendMoney(state, amount, reason) {
    var p = ensurePlayerSystems(state);
    var value = Math.round(Number(amount) || 0);
    if (!p || value <= 0) { return true; }
    p.money -= value;
    pushFinanceLog(p, state, reason || "Расход", -value);
    updateDebtStatus(state, "spend");
    return true;
  }

  function adjustFatigue(state, amount, reason) {
    var p = ensurePlayerSystems(state);
    if (!p) { return 0; }
    p.fatigue = U.clamp(Math.round((Number(p.fatigue) || 0) + (Number(amount) || 0)), 0, 100);
    if (reason && p.careerLog) {
      p.careerLog.unshift({ week: state.week, text: reason + ": усталость " + p.fatigue + "/100." });
    }
    return p.fatigue;
  }

  function isLockedByFatigue(state) {
    var p = ensurePlayerSystems(state);
    var limit = Data.economy && Data.economy.fatigue ? (Number(Data.economy.fatigue.actionLockAbove) || 75) : 75;
    return !!(p && p.fatigue > limit);
  }

  function fatigueLockedModal(state) {
    var p = ensurePlayerSystems(state);
    var limit = Data.economy && Data.economy.fatigue ? (Number(Data.economy.fatigue.actionLockAbove) || 75) : 75;
    state.modal = { type: "fatigueLock", fatigue: p ? p.fatigue : 100, limit: limit };
    state.feed = "Усталость выше " + limit + "/100. Бои, турниры и тренировка закрыты до восстановления.";
    return false;
  }

  function debtWeeksLeft(state) {
    var p = ensurePlayerSystems(state);
    if (!p || !p.debtStartWeek || p.money >= 0) { return 0; }
    return Math.max(0, (p.debtDeadlineWeek || (p.debtStartWeek + 12)) - state.week);
  }

  function updateDebtStatus(state, reason) {
    var p = ensurePlayerSystems(state);
    var weeksLeft;
    if (!p) { return; }
    if (p.money < 0 && !p.debtStartWeek) {
      p.debtStartWeek = state.week;
      p.debtDeadlineWeek = state.week + 12;
      state.modal = {
        type: "debtNotice",
        title: "Баланс ушёл в минус",
        text: "У тебя есть 3 месяца, чтобы выйти в плюс. Если долг останется после срока — игра закончится.",
        money: p.money,
        weeksLeft: 12
      };
      return;
    }
    if (p.money >= 0 && p.debtStartWeek) {
      p.debtStartWeek = 0;
      p.debtDeadlineWeek = 0;
      state.modal = {
        type: "debtNotice",
        title: "Долг закрыт",
        text: "Баланс снова в плюсе. Таймер банкротства снят.",
        money: p.money,
        weeksLeft: 0
      };
      return;
    }
    if (p.money < 0 && p.debtStartWeek) {
      weeksLeft = debtWeeksLeft(state);
      if (weeksLeft <= 0) {
        state.gameOver = true;
        state.modal = {
          type: "gameOver",
          title: "Игра окончена",
          text: "Ты не вышел из минуса за 3 месяца. Карьера сорвалась из-за долгов.",
          money: p.money
        };
      }
    }
  }

  function equipmentSummary(state) {
    var p = ensurePlayerSystems(state);
    var items = Data.economy && Data.economy.equipment ? Data.economy.equipment : [];
    var owned = [];
    var trainingBonus = 0;
    var fatigueReduction = 0;
    var upkeep = 0;
    if (!p) { return { owned: owned, trainingBonus: 0, fatigueReduction: 0, upkeep: 0 }; }
    items.forEach(function (item) {
      if (p.equipment[item.id]) {
        owned.push(item);
        trainingBonus += Number(item.trainingBonus) || 0;
        fatigueReduction += Number(item.fatigueReduction) || 0;
        upkeep += Number(item.upkeep) || 0;
      }
    });
    return { owned: owned, trainingBonus: trainingBonus, fatigueReduction: fatigueReduction, upkeep: upkeep };
  }

  function clubMonthlyFee(state) {
    var club = window.FS.Clubs && window.FS.Clubs.playerClub ? window.FS.Clubs.playerClub(state) : null;
    if (!club) { return 0; }
    return Math.round(35 + (Number(club.level) || 1) * 42);
  }

  function monthlyExpenseBreakdown(state) {
    var p = ensurePlayerSystems(state);
    var econ = Data.economy || {};
    var trackCost;
    var food;
    var medical;
    var clubFee;
    var equipment = 0;
    var multiplier;
    var total;

    if (p && p.age < 18) {
      return { trackCost: 0, food: 0, medical: 0, clubFee: 0, equipment: 0, total: 0, freeYouth: true };
    }

    trackCost = econ.livingCostByTrack ? (econ.livingCostByTrack[p.trackId] || 100) : 100;
    food = Number(econ.foodCost) || 70;
    medical = Number(econ.medicalReserveCost) || 45;
    clubFee = clubMonthlyFee(state);
    multiplier = Number(p.expenseMultiplier) || 1;
    total = Math.round((trackCost + food + medical + clubFee + equipment) * multiplier);
    return { trackCost: Math.round(trackCost * multiplier), food: Math.round(food * multiplier), medical: Math.round(medical * multiplier), clubFee: Math.round(clubFee * multiplier), equipment: 0, total: total, multiplier: multiplier };
  }

  function applyMonthlyExpenses(state) {
    var p = ensurePlayerSystems(state);
    var parts;
    if (!p) { return false; }
    if (state.week <= 1 || state.week % 4 !== 1 || p.lastExpenseWeek === state.week) { return false; }
    parts = monthlyExpenseBreakdown(state);
    p.lastExpenseWeek = state.week;
    p.monthlyExpenseLog.unshift({ week: state.week, total: parts.total, parts: parts });
    if (p.monthlyExpenseLog.length > 24) { p.monthlyExpenseLog.length = 24; }
    p.money -= parts.total;
    pushFinanceLog(p, state, "Ежемесячные расходы", -parts.total);
    if (p.money >= 0) {
      adjustFatigue(state, -4, "Нормальный месяц оплачен");
      state.feed = "Ежемесячные расходы: -$" + parts.total + ".";
    } else {
      adjustFatigue(state, Data.economy && Data.economy.fatigue ? Data.economy.fatigue.monthlyStressNoMoney : 16, "Деньги ушли в минус");
      state.feed = "Деньги ушли в минус. Есть 3 месяца, чтобы выйти в плюс.";
    }
    updateDebtStatus(state, "monthly");
    return true;
  }

  function buyEquipment(state, itemId) {
    var p = ensurePlayerSystems(state);
    var items = Data.economy && Data.economy.equipment ? Data.economy.equipment : [];
    var item = items.find(function (entry) { return entry.id === itemId; });
    if (!p || !item) { return false; }
    if (p.equipment[item.id]) { state.feed = "Эта экипировка уже куплена."; return false; }
    if (!spendMoney(state, item.cost, "Покупка: " + item.label)) { return false; }
    p.equipment[item.id] = true;
    state.feed = "Куплено: " + item.label + ".";
    return true;
  }

  function buyMedicalService(state, serviceId) {
    var service = Data.economy && Data.economy.medicalServices ? Data.economy.medicalServices.find(function (entry) { return entry.id === serviceId; }) : null;
    if (!service) { return false; }
    if (!spendMoney(state, service.cost, service.label)) { return false; }
    adjustFatigue(state, service.fatigue, service.label);
    state.feed = service.label + ": усталость снижена.";
    return true;
  }

  function restPlayer(state) {
    var reduction = Data.economy && Data.economy.fatigue ? (Number(Data.economy.fatigue.restWeek) || 20) : 20;
    adjustFatigue(state, -reduction, "Неделя восстановления");
    state.feed = "Неделя восстановления: усталость -" + reduction + ".";
    updateDebtStatus(state, "rest");
    return true;
  }

  function checkAutomaticProMove(state, fighter) {
    var target = fighter || player(state);
    if (!target || target.trackId !== "amateur") { return false; }
    if (U.statAverage(target.stats) >= 121) {
      switchFighterTrack(state, target, "pro", "автоматический переход по OVR");
      target.weightClassId = target.weightClassId || "welter";
      if (target.isPlayer) {
        state.selectedTab = "pro";
        state.feed = "OVR 121. Автоматический переход в профессионалы.";
        target.careerLog.unshift({ week: state.week, text: "Автоматический переход в профи при OVR 121." });
      }
      invalidateCaches(state);
      return true;
    }
    return false;
  }

  function trainPlayer(state, statKey) {
    var p = ensurePlayerSystems(state);
    var keys = ["power", "technique", "speed", "stamina", "defense"];
    var cap;
    var cost;

    if (!p) { return; }
    p.trainingPoints = Number(p.trainingPoints) || 0;

    if (!statKey) {
      if (isLockedByFatigue(state)) {
        fatigueLockedModal(state);
        return;
      }
      cost = Data.economy && Data.economy.fatigue ? (Number(Data.economy.fatigue.training) || 15) : 15;
      p.trainingPoints += 3;
      adjustFatigue(state, cost, "Тренировка");
      p.careerLog.unshift({ week: state.week, text: "Тренировка: +3 очка характеристик, усталость " + p.fatigue + "/100." });
      state.feed = "Тренировка: +3 очка характеристик. Усталость +" + cost + ".";
      updateDebtStatus(state, "training");
      return;
    }

    if (keys.indexOf(statKey) === -1) { return; }
    if (p.trainingPoints <= 0) { state.feed = "Не хватает очков прокачки."; return; }
    cap = U.findTrack(p.trackId).maxStat;
    p.trainingPoints -= 1;
    p.stats[statKey] = U.clamp(p.stats[statKey] + 1, 1, cap);
    updateDerivedFighterFields(p);
    checkAutomaticProMove(state, p);
    invalidateCaches(state);
    p.careerLog.unshift({ week: state.week, text: "Прокачка: +" + U.getStatLabel(statKey) + "." });
    state.feed = "Потрачено 1 очко. Улучшен навык: " + U.getStatLabel(statKey) + ".";
  }

  function getFighterAwards(state, fighter) {
    var result = [];
    var seen = {};

    function normalizeText(value) {
      return String(value || "").trim();
    }

    function normalizePlace(value, fallbackLabel, fallbackMedal) {
      var text = (normalizeText(value) + " " + normalizeText(fallbackLabel) + " " + normalizeText(fallbackMedal)).toLowerCase();
      if (/\b1\b/.test(text) && /мест/.test(text)) { return "1 место"; }
      if (/\b2\b/.test(text) && /мест/.test(text)) { return "2 место"; }
      if (/\b3\b/.test(text) && /мест/.test(text)) { return "3 место"; }
      if (/победитель|чемпион|gold|золото|🥇/.test(text)) { return "1 место"; }
      if (/серебро|silver|🥈/.test(text)) { return "2 место"; }
      if (/бронза|bronze|🥉/.test(text)) { return "3 место"; }
      return "";
    }

    function medalFromPlace(place) {
      if (place === "1 место") { return "gold"; }
      if (place === "2 место") { return "silver"; }
      if (place === "3 место") { return "bronze"; }
      return "";
    }

    function placeFromMedal(medal) {
      if (medal === "gold") { return "1 место"; }
      if (medal === "silver") { return "2 место"; }
      if (medal === "bronze") { return "3 место"; }
      return "";
    }

    function titleFromLabel(label) {
      var text = normalizeText(label);
      var match;
      match = text.match(/^(Победитель|Серебро|Бронза)\s*·\s*(.+?)\.?$/i);
      if (match) { return match[2].trim(); }
      match = text.match(/^(.+?)\s*·\s*(Победитель|Серебро|Бронза|1 место|2 место|3 место)\.?$/i);
      if (match) { return match[1].trim(); }
      match = text.match(/^Турнир:\s*(.+?)\s*·\s*(Победитель|Серебро|Бронза|1 место|2 место|3 место).*$/i);
      if (match) { return match[1].trim(); }
      return text.replace(/^(🥇|🥈|🥉)\s*/, "").trim();
    }

    function normalizedLabel(label, place) {
      var title = titleFromLabel(label);
      if (!place) { return normalizeText(label); }
      if (place === "1 место") { return "Победитель · " + title; }
      if (place === "2 место") { return "Серебро · " + title; }
      if (place === "3 место") { return "Бронза · " + title; }
      return normalizeText(label);
    }

    function keyOf(award) {
      return [
        award.label || "",
        award.source || "",
        award.competitionId || "",
        award.place || "",
        Number(award.week) || 0
      ].join("|");
    }

    function pushAward(award) {
      var item;
      var key;
      var place;
      var medal;
      if (!award || !award.label) { return; }

      place = normalizePlace(award.place || "", award.label || "", award.medal || "");
      if (!place && award.medal) { place = placeFromMedal(award.medal); }
      medal = award.medal || medalFromPlace(place);

      item = {
        id: award.id || "",
        week: Number(award.week) || 0,
        label: normalizedLabel(award.label, place),
        source: award.source || "award",
        medal: medal || medalFromPlace(place),
        competitionId: award.competitionId || (award.meta && award.meta.competitionId) || "",
        place: place || award.place || ""
      };

      key = keyOf(item);
      if (seen[key]) { return; }
      seen[key] = true;
      result.push(item);
    }

    function awardLabelFromMedal(medal) {
      var label = medal.label || "Турнир";
      var place = normalizePlace(medal.place || "", medal.awardLabel || medal.label || "", medal.medal || "");
      if (medal.awardLabel) { return normalizedLabel(medal.awardLabel, place); }
      return normalizedLabel(label, place);
    }

    function recoverFromLog(entry) {
      var text = entry && entry.text ? String(entry.text).trim() : "";
      var meta = entry && entry.meta ? entry.meta : {};
      var match;
      var place = meta.place || "";
      var label = "";
      if (!text) { return; }

      match = text.match(/^Турнир:\s*(.+?)\s*·\s*(Победитель|Серебро|Бронза|1 место|2 место|3 место)/i);
      if (match) {
        place = normalizePlace(place, match[2], "");
        label = normalizedLabel(match[1].trim(), place);
      }

      if (!label) {
        match = text.match(/^(Победитель|Серебро|Бронза)\s*·\s*(.+?)\.?$/i);
        if (match) {
          place = normalizePlace(place, match[1], "");
          label = normalizedLabel(match[2].trim(), place);
        }
      }

      if (!label) {
        match = text.match(/^(.+?)\s*·\s*(Победитель|Серебро|Бронза|1 место|2 место|3 место)\.?$/i);
        if (match) {
          place = normalizePlace(place, match[2], "");
          label = normalizedLabel(match[1].trim(), place);
        }
      }

      if (!label) {
        place = normalizePlace(place, text, "");
        if (place) { label = normalizedLabel(titleFromLabel(text), place); }
      }

      if (!label || !place) { return; }

      pushAward({
        week: entry.week,
        label: label,
        source: "amateur",
        medal: medalFromPlace(place),
        competitionId: meta.competitionId || "",
        place: place
      });
    }

    if (!fighter) { return result; }
    fighter.awards = fighter.awards instanceof Array ? fighter.awards : [];
    fighter.awards.forEach(pushAward);

    if (fighter.isPlayer && state.amateurPath && state.amateurPath.medals instanceof Array) {
      state.amateurPath.medals.forEach(function (medal) {
        pushAward({
          id: medal.id || "",
          week: medal.week,
          label: awardLabelFromMedal(medal),
          source: "amateur",
          medal: medal.medal || medalFromPlace(normalizePlace(medal.place || "", medal.awardLabel || medal.label || "", medal.medal || "")),
          competitionId: medal.competitionId || "",
          place: normalizePlace(medal.place || "", medal.awardLabel || medal.label || "", medal.medal || "")
        });
      });
    }

    if (fighter.careerLog instanceof Array) {
      fighter.careerLog.forEach(recoverFromLog);
    }

    result.sort(function (a, b) { return (Number(b.week) || 0) - (Number(a.week) || 0); });
    return result;
  }

  function addFighterAward(state, fighter, awardLabel, source, meta) {
    var data = meta || {};
    var awardSource = source || "award";
    var medal = data.medal || (data.place === "1 место" ? "gold" : (data.place === "2 место" ? "silver" : (data.place === "3 место" ? "bronze" : "")));
    var exists;
    if (!fighter || !awardLabel) { return; }
    fighter.awards = fighter.awards instanceof Array ? fighter.awards : [];

    exists = fighter.awards.some(function (award) {
      return award.label === awardLabel &&
        award.source === awardSource &&
        (award.competitionId || "") === (data.competitionId || "") &&
        (award.place || "") === (data.place || "") &&
        (Number(award.week) || 0) === (Number(state.week) || 0);
    });

    if (!exists) {
      fighter.awards.unshift({
        id: U.uid("award"),
        week: state.week,
        label: awardLabel,
        source: awardSource,
        medal: medal,
        competitionId: data.competitionId || "",
        place: data.place || ""
      });
      if (fighter.awards.length > 60) { fighter.awards.length = 60; }
    }
  }

  function invalidateCaches(state) {
    if (!state) { return; }
    state._rankingVersion = (Number(state._rankingVersion) || 0) + 1;
    state._rankingCache = {};
  }

  function rankingCacheKey(state, countryId, trackId, weightClassId) {
    return [
      Number(state.week) || 1,
      Number(state._rankingVersion) || 0,
      countryId || "",
      trackId || "",
      weightClassId || ""
    ].join("|");
  }

  function recordStrengthForRanking(fighter) {
    var record = fighter.record || {};
    var wins = Number(record.wins) || 0;
    var losses = Number(record.losses) || 0;
    var draws = Number(record.draws) || 0;
    var kos = Number(record.kos) || 0;
    var total = wins + losses + draws;
    var winRate = total ? wins / total : 0;
    var activity = Math.min(total, fighter.trackId === "pro" ? 60 : 160);
    var titleBonus = fighter.titles ? Math.min(fighter.titles.length * 18, 72) : 0;
    var awardBonus = fighter.awards ? Math.min(fighter.awards.length * 8, 40) : 0;

    return wins * 3.2 - losses * 4.6 + draws * 0.6 + kos * 0.55 + winRate * 34 + activity * 0.28 + titleBonus + awardBonus;
  }

  function ranking(state, countryId, trackId, weightClassId) {
    var key;
    var result;

    state._rankingCache = state._rankingCache && typeof state._rankingCache === "object" ? state._rankingCache : {};
    key = rankingCacheKey(state, countryId, trackId, weightClassId);
    if (state._rankingCache[key]) {
      return state._rankingCache[key];
    }

    result = state.roster
      .filter(function (fighter) {
        var countryOk;
        var weightOk;

        if (trackId === "pro") {
          countryOk = true;
          weightOk = !weightClassId || fighter.weightClassId === weightClassId;
        } else if (trackId === "street") {
          countryOk = countryId === "world" || !countryId || fighter.countryId === countryId;
          weightOk = true;
        } else {
          countryOk = countryId === "world" || !countryId || fighter.countryId === countryId;
          weightOk = !weightClassId || fighter.weightClassId === weightClassId;
        }

        return !fighter.retired && countryOk && fighter.trackId === trackId && weightOk;
      })
      .sort(function (left, right) {
        var leftOvr = U.statAverage(left.stats);
        var rightOvr = U.statAverage(right.stats);
        if (trackId === "amateur" || trackId === "street") {
          if (rightOvr !== leftOvr) { return rightOvr - leftOvr; }
          return recordStrengthForRanking(right) - recordStrengthForRanking(left);
        }
        return (recordStrengthForRanking(right) + rightOvr * 0.08) - (recordStrengthForRanking(left) + leftOvr * 0.08);
      });

    state._rankingCache[key] = result;
    return result;
  }

  function inferStableAge(fighter, index, week) {
    var seed = Math.abs(Number(fighter.seed) || index + 1);
    var rating = U.statAverage(fighter.stats || {});
    if (fighter.isPlayer) {
      if (Number(fighter.age) > 15) { return Number(fighter.age); }
      if (fighter.trackId === "pro") { return 20; }
      if (fighter.trackId === "street") { return 18; }
      return 18;
    }
    if (Number(fighter.age) > 15 && Number(fighter.age) < 60 && !fighter.__ageBugRepaired260) {
      return Number(fighter.age);
    }
    if (fighter.trackId === "pro") {
      return U.clamp(20 + (seed % 19) + (rating >= 170 ? 3 : 0), 20, 41);
    }
    if (fighter.trackId === "street") {
      return U.clamp(18 + (seed % 24), 18, 45);
    }
    return U.clamp(16 + (seed % 15), 16, 31);
  }

  function repairAgeAndNameSchema(state) {
    var i;
    var fighter;
    var originCountryId;
    var seed;
    var baseAge;
    var elapsedYears;
    var currentWeek;
    if (!state || !(state.roster instanceof Array)) { return; }

    currentWeek = Math.max(1, Number(state.week) || 1);

    for (i = 0; i < state.roster.length; i += 1) {
      fighter = state.roster[i];
      if (!fighter) { continue; }

      seed = Math.abs(Number(fighter.seed) || i + 1);

      if (!fighter.ageBaseWeek || Number(fighter.age) <= 15 || fighter.__ageSchemaVersion !== "age-v2") {
        if (fighter.isPlayer) {
          if (Number(fighter.age) > 15) { baseAge = Number(fighter.age); }
          else { baseAge = fighter.trackId === "pro" ? 20 : 18; }
        } else if (fighter.trackId === "pro") {
          baseAge = U.clamp(20 + (seed % 18), 20, 41);
        } else if (fighter.trackId === "street") {
          baseAge = U.clamp(18 + (seed % 24), 18, 45);
        } else {
          baseAge = U.clamp(16 + (seed % 15), 16, 31);
        }
        fighter.baseAge = baseAge;
        fighter.ageBaseWeek = currentWeek;
        fighter.__ageSchemaVersion = "age-v2";
        fighter.__ageBugRepaired260 = true;
      }

      elapsedYears = Math.max(0, Math.floor((currentWeek - (Number(fighter.ageBaseWeek) || currentWeek)) / 48));
      fighter.age = U.clamp((Number(fighter.baseAge) || Number(fighter.age) || 18) + elapsedYears, 14, 60);
      fighter.birthMonth = Number(fighter.birthMonth) || U.randomInt(1, 12);
      fighter.birthWeek = Number(fighter.birthWeek) || U.randomInt(1, 4);

      originCountryId = fighter.originCountryId || fighter.homeCountryId || fighter.nameCountryId || fighter.countryId;
      if (!fighter.isPlayer && fighter.namesSchemaVersion !== NAME_SCHEMA_VERSION) {
        fighter.name = countrySpecificName(U.findCountry(originCountryId), seed + i * 131);
        fighter.nameCountryId = originCountryId;
        fighter.namesSchemaVersion = NAME_SCHEMA_VERSION;
      }
    }
  }

  function repairState(state) {
    var i;
    var p;

    if (!state) { return null; }
    if (state._fullRepairDone && state._lastRepairVersion === Data.appVersion) {
      return state;
    }
    state.version = (Data && Data.appVersion) || "boot-core-hotfix-2.6.1";
    state.week = Math.max(1, Number(state.week) || 1);
    state.rankingPage = Math.max(0, Number(state.rankingPage) || 0);
    state.offerRefreshSalt = Number(state.offerRefreshSalt) || 0;
    state.trackedFighterIds = state.trackedFighterIds instanceof Array ? state.trackedFighterIds : [];
    state.amateurPath = state.amateurPath && typeof state.amateurPath === "object" ? state.amateurPath : { completed: {}, medals: [], lastCompetitionWeekById: {}, points: 0 };
    state.amateurPath.completed = state.amateurPath.completed || {};
    state.amateurPath.medals = state.amateurPath.medals instanceof Array ? state.amateurPath.medals : [];
    state.amateurPath.lastCompetitionWeekById = state.amateurPath.lastCompetitionWeekById || {};
    state.amateurPath.points = Number(state.amateurPath.points) || 0;
    state.offers = state.offers instanceof Array ? state.offers : [];
    state.clubs = state.clubs instanceof Array ? state.clubs : [];
    state.titles = state.titles && typeof state.titles === "object" ? state.titles : {};
    state.people = state.people instanceof Array ? state.people : [];
    state.roster = state.roster instanceof Array ? state.roster : [];
    if (!state.world) {
      state.world = { news: [], weekReports: [], teamsByCountry: {}, transitionLog: [], stories: [] };
    }
    state.world.news = state.world.news instanceof Array ? state.world.news : [];
    state.world.weekReports = state.world.weekReports instanceof Array ? state.world.weekReports : [];
    state.world.teamsByCountry = state.world.teamsByCountry || {};
    state.world.transitionLog = state.world.transitionLog instanceof Array ? state.world.transitionLog : [];
    state.world.stories = state.world.stories instanceof Array ? state.world.stories : [];
    state.world.memorials = state.world.memorials instanceof Array ? state.world.memorials : [];
    state.world.nationalTeamQualification = state.world.nationalTeamQualification || {};
    state.world.reserveAdditions = state.world.reserveAdditions || {};
    state.world.teamCoaches = state.world.teamCoaches || {};
    state.world.proContracts = state.world.proContracts instanceof Array ? state.world.proContracts : [];
    state.world.proContractHistory = state.world.proContractHistory instanceof Array ? state.world.proContractHistory : [];
    state.world.tournamentCalendar = state.world.tournamentCalendar instanceof Array ? state.world.tournamentCalendar : [];
    state.world.pendingTournamentInvite = state.world.pendingTournamentInvite || null;
    state.world.pendingProFight = state.world.pendingProFight || null;

    for (i = 0; i < state.roster.length; i += 1) {
      state.roster[i].titles = state.roster[i].titles instanceof Array ? state.roster[i].titles : [];
      state.roster[i].careerLog = state.roster[i].careerLog instanceof Array ? state.roster[i].careerLog : [];
      state.roster[i].storyFlags = state.roster[i].storyFlags instanceof Array ? state.roster[i].storyFlags : [];
      state.roster[i].awards = state.roster[i].awards instanceof Array ? state.roster[i].awards : [];
      state.roster[i].trainingPoints = Number(state.roster[i].trainingPoints) || 0;
      state.roster[i].birthMonth = state.roster[i].birthMonth || U.randomInt(1, 12);
      state.roster[i].birthWeek = state.roster[i].birthWeek || U.randomInt(1, 4);
      state.roster[i].retired = !!state.roster[i].retired;
      state.roster[i].recentOpponentIds = state.roster[i].recentOpponentIds instanceof Array ? state.roster[i].recentOpponentIds : [];
      state.roster[i].money = Number(state.roster[i].money) || 0;
      state.roster[i].fatigue = U.clamp(Number(state.roster[i].fatigue) || 0, 0, 100);
      state.roster[i].equipment = state.roster[i].equipment && typeof state.roster[i].equipment === "object" ? state.roster[i].equipment : {};
      state.roster[i].financeLog = state.roster[i].financeLog instanceof Array ? state.roster[i].financeLog : [];
      state.roster[i].monthlyExpenseLog = state.roster[i].monthlyExpenseLog instanceof Array ? state.roster[i].monthlyExpenseLog : [];
      state.roster[i].lastExpenseWeek = Number(state.roster[i].lastExpenseWeek) || 1;
      state.roster[i].fatigue = U.clamp(Number(state.roster[i].fatigue) || 0, 0, 100);
      state.roster[i].equipment = state.roster[i].equipment && typeof state.roster[i].equipment === "object" ? state.roster[i].equipment : {};
      state.roster[i].financeLog = state.roster[i].financeLog instanceof Array ? state.roster[i].financeLog : [];
      state.roster[i].monthlyExpenseLog = state.roster[i].monthlyExpenseLog instanceof Array ? state.roster[i].monthlyExpenseLog : [];
      state.roster[i].lastExpenseWeek = Number(state.roster[i].lastExpenseWeek) || 1;
      state.roster[i].debtStartWeek = Number(state.roster[i].debtStartWeek) || 0;
      state.roster[i].debtDeadlineWeek = Number(state.roster[i].debtDeadlineWeek) || 0;
      state.roster[i].nextFightWeek = Number(state.roster[i].nextFightWeek) || 0;
      state.roster[i].contractOpponentId = state.roster[i].contractOpponentId || "";
      state.roster[i].contractLabel = state.roster[i].contractLabel || "";
      state.roster[i].contractPurse = Number(state.roster[i].contractPurse) || 0;
      state.roster[i].contractRounds = Number(state.roster[i].contractRounds) || 0;
      state.roster[i].contractId = state.roster[i].contractId || "";
      state.roster[i].promoterId = state.roster[i].promoterId || "";
      state.roster[i].expenseMultiplier = Number(state.roster[i].expenseMultiplier) || 1;
      state.roster[i].hardModeDebt = !!state.roster[i].hardModeDebt;
      state.roster[i].archetypeId = state.roster[i].archetypeId || "";
      ensureTrackRecords(state.roster[i]);
      clampFighterStats(state.roster[i]);
      updateDerivedFighterFields(state.roster[i]);
    }

    repairAgeAndNameSchema(state);

    p = player(state);
    if (p) {
      state.rankingCountryId = state.rankingCountryId || p.countryId;
      state.rankingTrackId = state.rankingTrackId || p.trackId;
      state.rankingWeightClassId = state.rankingWeightClassId || p.weightClassId || "welter";
    }

    state._fullRepairDone = true;
    state._lastRepairVersion = Data.appVersion;
    state._lastRepairWeek = state.week;
    return state;
  }

  function playerRank(state, countryId, trackId, weightClassId) {
    var p = player(state);
    var list;
    var i;

    if (!p) { return 0; }
    list = ranking(state, countryId || p.countryId, trackId || p.trackId, weightClassId || p.weightClassId);
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === p.id) {
        return i + 1;
      }
    }
    return 0;
  }

  function pathProgress(state, fighter) {
    var target = fighter || player(state);
    var rank;
    var score;
    var tier;
    var stage;

    if (!target) {
      return { title: "Нет данных", lines: [] };
    }

    score = U.statAverage(target.stats);
    tier = window.FS.Matchmaking ? window.FS.Matchmaking.careerTier(target) : { label: "Боец" };
    stage = window.FS.Matchmaking ? window.FS.Matchmaking.careerStage(target) : { label: "Базовый уровень" };

    if (target.trackId === "amateur") {
      rank = rankForFighter(target);
      return {
        title: "Любительский путь",
        badge: rank.label,
        lines: [
          "Ступень: " + stage.label,
          "Класс бойца: " + tier.label,
          "Текущий разряд: " + rank.label,
          "Позиция в дивизионе: #" + (playerRank(state, target.countryId, target.trackId, target.weightClassId) || "—")
        ]
      };
    }

    if (target.trackId === "street") {
      return {
        title: "Уличный путь",
        badge: tier.label,
        lines: [
          "Класс бойца: " + tier.label,
          "Уличный рейтинг: " + (target.streetRating || score),
          "Позиция в стране: #" + (playerRank(state, target.countryId, target.trackId, "") || "—")
        ]
      };
    }

    return {
      title: "Профессиональный путь",
      badge: tier.label,
      lines: [
        "Класс бойца: " + tier.label,
        "Профи-рейтинг: " + (target.proRating || score),
        "Мировая позиция: #" + (playerRank(state, "world", target.trackId, target.weightClassId) || "—")
      ]
    };
  }

  function dateParts(state) {
    var months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
    var weekIndex = Math.max(0, (Number(state.week) || 1) - 1);
    var year = Math.floor(weekIndex / 48) + 1;
    var monthIndex = Math.floor((weekIndex % 48) / 4);
    var weekOfMonth = (weekIndex % 4) + 1;
    return { year: year, month: monthIndex + 1, monthLabel: months[monthIndex], weekOfMonth: weekOfMonth };
  }

  function dateText(state) {
    var parts = dateParts(state);
    return "год " + parts.year + ", " + parts.monthLabel + ", " + parts.weekOfMonth + " неделя";
  }


  window.FS.State = {
    createCareer: createCareer,
    createFighter: createFighter,
    createRecord: createRecord,
    player: player,
    syncPlayer: syncPlayer,
    setPlayerTrack: setPlayerTrack,
    setPlayerCountry: setPlayerCountry,
    setPlayerWeightClass: setPlayerWeightClass,
    setTactic: setTactic,
    trainPlayer: trainPlayer,
    updateDerivedFighterFields: updateDerivedFighterFields,
    updateAllDerived: updateAllDerived,
    ranking: ranking,
    getFighterAwards: getFighterAwards,
    addFighterAward: addFighterAward,
    rankForFighter: rankForFighter,
    repairState: repairState,
    playerRank: playerRank,
    pathProgress: pathProgress,
    switchFighterTrack: switchFighterTrack,
    ensureTrackRecords: ensureTrackRecords,
    cloneRecord: cloneRecord,
    dateParts: dateParts,
    dateText: dateText,
    suggestNameForCountry: suggestNameForCountry,
    ensurePlayerSystems: ensurePlayerSystems,
    addMoney: addMoney,
    spendMoney: spendMoney,
    adjustFatigue: adjustFatigue,
    monthlyExpenseBreakdown: monthlyExpenseBreakdown,
    applyMonthlyExpenses: applyMonthlyExpenses,
    equipmentSummary: equipmentSummary,
    buyEquipment: buyEquipment,
    buyMedicalService: buyMedicalService,
    restPlayer: restPlayer,
    isLockedByFatigue: isLockedByFatigue,
    fatigueLockedModal: fatigueLockedModal,
    debtWeeksLeft: debtWeeksLeft,
    updateDebtStatus: updateDebtStatus,
    invalidateCaches: invalidateCaches,
    checkAutomaticProMove: checkAutomaticProMove
  };
}());
