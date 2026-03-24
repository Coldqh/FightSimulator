var COUNTRY_DATA = (function () {
  function list(text) {
    return text.split("|");
  }

  function combine(left, right, mode) {
    if (mode === "space") {
      return left + " " + right;
    }
    if (mode === "hyphen") {
      return left + "-" + right;
    }
    return left + right;
  }

  function buildPool(left, right, mode) {
    var values = [];
    var seen = {};
    var i;
    var j;
    var value;
    for (i = 0; i < left.length; i += 1) {
      for (j = 0; j < right.length; j += 1) {
        value = combine(left[i], right[j], mode);
        if (!seen[value]) {
          seen[value] = true;
          values.push(value);
        }
      }
    }
    return values.slice(0, 200);
  }

  function sanitizeNicknameWord(value) {
    var label = String(value || "").replace(/["']/g, " ").replace(/[.,!?;:]+/g, " ").replace(/^\s+|\s+$/g, "");
    var parts;
    if (!label) {
      return "";
    }
    parts = label.split(/\s+/);
    label = parts.length ? parts[0] : "";
    if (label.indexOf("-") >= 0) {
      label = label.split("-")[0];
    }
    return label.replace(/^\s+|\s+$/g, "");
  }

  function buildNicknamePool(left, right) {
    var values = [];
    var seen = {};
    var sources = [left || [], right || []];
    var i;
    var j;
    var value;
    for (i = 0; i < sources.length; i += 1) {
      for (j = 0; j < sources[i].length; j += 1) {
        value = sanitizeNicknameWord(sources[i][j]);
        if (value && !seen[value]) {
          seen[value] = true;
          values.push(value);
        }
      }
    }
    return values.slice(0, 120);
  }

  var seeds = {
    mexico: {
      firstJoin: "space",
      firstLeft: list("Juan|Jose|Luis|Miguel|Carlos|Diego|Javier|Angel|Mario|Raul|Pedro|Arturo|Hector|Manuel|Roberto|Eduardo|Fernando|Ricardo|Victor|Alejandro"),
      firstRight: list("Antonio|Emiliano|Ramon|Esteban|Leonel|Ismael|Joaquin|Matias|Bruno|Alexis"),
      lastJoin: "space",
      lastLeft: list("Garcia|Hernandez|Martinez|Lopez|Gonzalez|Perez|Sanchez|Ramirez|Torres|Flores|Rivera|Gomez|Diaz|Cruz|Mendoza|Castillo|Reyes|Morales|Vargas|Chavez"),
      lastRight: list("Navarro|Salazar|Ortega|Aguilar|Valdez|Serrano|Rojas|Bautista|Contreras|Villanueva"),
      nickJoin: "space",
      nickLeft: list("Toro|Jaguar|Trueno|Diablo|Machete|Rayo|Martillo|Coyote|Vibora|Huracan|Acero|Coloso|Fantasma|Tempestad|Colmillo|Polvora|Meteoro|Lobo|Ciclon|Titan"),
      nickRight: list("del Barrio|del Norte|de Hierro|Rojo|Negro|Salvaje|del Ring|Dorado|Implacable|Nocturno")
    },
    usa: {
      firstJoin: "space",
      firstLeft: list("Mason|Liam|Ethan|Noah|Caleb|Logan|Jack|Ryan|Tyler|Carter|Wesley|Hayden|Dylan|Brandon|Chase|Austin|Connor|Trevor|Nathan|Colton"),
      firstRight: list("James|Scott|Blake|Dean|Cole|Wade|Brooks|Luke|Ray|Jordan"),
      lastJoin: "hyphen",
      lastLeft: list("Smith|Johnson|Williams|Brown|Davis|Miller|Wilson|Moore|Taylor|Anderson|Thomas|Jackson|White|Harris|Martin|Thompson|Robinson|Clark|Lewis|Walker"),
      lastRight: list("Cooper|Hall|Young|Allen|Wright|King|Green|Hill|Brooks|Reed"),
      nickJoin: "space",
      nickLeft: list("Iron|Midnight|Razor|Diesel|Bullet|Brick|Steel|Phantom|Viper|Thunder|Outlaw|Hammer|Havoc|Comet|Blaze|Wolf|Gunner|Storm|Rumble|Shadow"),
      nickRight: list("Hands|Machine|Rebel|Driver|Flash|Crusher|Ranger|Titan|Brawler|King")
    },
    russia: {
      firstJoin: "join",
      firstLeft: list("Иван|Дмитрий|Сергей|Алексей|Михаил|Виктор|Николай|Андрей|Павел|Юрий|Константин|Артем|Денис|Егор|Максим|Роман|Кирилл|Олег|Тимур|Илья"),
      firstRight: list(""),
      lastJoin: "join",
      lastLeft: list("Иванов|Петров|Сидоров|Смирнов|Кузнецов|Попов|Васильев|Федоров|Волков|Соловьев|Морозов|Лебедев|Козлов|Новиков|Павлов|Соколов|Виноградов|Макаров|Орлов|Егоров"),
      lastRight: list(""),
      nickJoin: "space",
      nickLeft: list("Северный|Железный|Серый|Черный|Красный|Ледяной|Бешеный|Грозный|Каменный|Тихий|Дикий|Стальной|Ночной|Жесткий|Глухой|Хмурый|Лютый|Русский|Сибирский|Угольный"),
      nickRight: list("Волк|Медведь|Молот|Шторм|Лис|Локомотив|Ворон|Кулак|Град|Таран")
    },
    cuba: {
      firstJoin: "space",
      firstLeft: list("Juan|Jose|Luis|Miguel|Carlos|Ernesto|Rafael|Hector|Orlando|Ramon|Manuel|Roberto|Pedro|Diego|Adrian|Emilio|Victor|Alejandro|Reynaldo|Tomas"),
      firstRight: list("Enrique|Alberto|Lazaro|Yuniel|Armando|Julio|Fernando|Osvaldo|Leonel|Alexis"),
      lastJoin: "space",
      lastLeft: list("Rodriguez|Fernandez|Perez|Gonzalez|Lopez|Sanchez|Diaz|Reyes|Cruz|Cabrera|Castillo|Herrera|Batista|Mendez|Valdes|Guerra|Santana|Pardo|Mesa|Milanes"),
      lastRight: list("Alvarez|Moreno|Torres|Rojas|Silva|Rosales|Campos|Acosta|Benitez|Perdomo"),
      nickJoin: "space",
      nickLeft: list("Malecon|Caribe|Azucar|Huracan|Sonero|Tiburon|Habana|Guajiro|Trueno|Machete|Caiman|Relampago|Diablo|Tempestad|Toro|Viento|Fuego|Martillo|Marino|Fantasma"),
      nickRight: list("de La Habana|del Caribe|Azul|Salvaje|del Puerto|de Hierro|del Malecon|Nocturno|del Sol|Implacable")
    },
    japan: {
      firstJoin: "join",
      firstLeft: list("Haru|Kazu|Taka|Yoshi|Ryo|Ken|Masa|Hiro|Dai|Shin|Nao|Sora|Ren|Kyo|Yuta|Aki|Kei|Jun|Rei|Tatsu"),
      firstRight: list("to|ya|shi|ma|suke|hiro|nori|ichi|ta|o"),
      lastJoin: "join",
      lastLeft: list("Yama|Naka|Fuji|Mori|Kawa|Tani|Miya|Oka|Kuro|Shino|Sugi|Hira|Nishi|Kita|Arai|Koba|Ono|Hoshi|Ishi|Matsu"),
      lastRight: list("da|moto|saki|mura|gawa|no|ta|hara|bayashi|zawa"),
      nickJoin: "space",
      nickLeft: list("Tetsu|Kage|Kaminari|Tora|Oni|Kiba|Ryu|Kumo|Yoru|Kaze|Taiyo|Tsuki|Hagane|Arashi|Kuro|Gin|Gekko|Dokugan|Akai|Shiro"),
      nickRight: list("Blade|Tiger|Storm|Shadow|Dragon|Ghost|Hammer|Wolf|Titan|Fang")
    },
    china: {
      firstJoin: "space",
      firstLeft: list("Wei|Jian|Hao|Ming|Lei|Tao|Jun|Qiang|Chen|Bo|Kang|Peng|Rui|Xin|Yu|Long|Zhen|Tian|Sheng|Bin"),
      firstRight: list("Xiang|Dong|Feng|Yuan|Kai|Chao|Lin|Shuo|Gang|An"),
      lastJoin: "hyphen",
      lastLeft: list("Li|Wang|Zhang|Liu|Chen|Yang|Huang|Zhao|Wu|Zhou|Xu|Sun|Ma|Zhu|Hu|Guo|Lin|He|Gao|Luo"),
      lastRight: list("Wei|Rong|Shan|Qiu|Peng|Tao|Ning|Jun|Kai|Feng"),
      nickJoin: "space",
      nickLeft: list("Long|Hu|Lei|Ying|Hei|Bai|Shan|Tian|Huo|Tie|Yue|Xing|Zhen|Qing|Chi|Han|Jin|Bei|Nan|Dong"),
      nickRight: list("Dragon|Tiger|Hammer|Ghost|Fist|Storm|Wolf|Blade|Emperor|Comet")
    },
    uk: {
      firstJoin: "space",
      firstLeft: list("Arthur|Oliver|Henry|George|Theo|Archie|Freddie|Charlie|Alfie|Jack|William|Edward|Thomas|Oscar|Harry|Jude|Leo|Samuel|Benjamin|Nathan"),
      firstRight: list("James|Dean|Scott|Miles|Lewis|Blake|Ellis|Finley|Spencer|Graham"),
      lastJoin: "hyphen",
      lastLeft: list("Smith|Jones|Taylor|Brown|Davies|Evans|Wilson|Thomas|Roberts|Walker|Wright|Green|Hall|Clarke|Turner|Parker|Hughes|Bennett|Foster|Morgan"),
      lastRight: list("Baker|Carter|Reed|Cole|Ward|Price|Kent|Webb|Hart|Cross"),
      nickJoin: "space",
      nickLeft: list("Iron|Crown|Midnight|Brick|Razor|Union|Fog|Diesel|Royal|Hammer|North|Black|Red|Ghost|Steel|River|Storm|Wolf|Silent|Grim"),
      nickRight: list("Guard|Boxer|Prince|Titan|Brawler|Machine|Fox|Hammer|Giant|Warden")
    },
    philippines: {
      firstJoin: "space",
      firstLeft: list("Jose|Miguel|Carlo|Mark|John|Paulo|Angelo|Ramon|Nico|Adrian|Vince|Jerome|Rafael|Daniel|Christian|Joshua|Paolo|Mario|Enzo|Luis"),
      firstRight: list("Rey|Xavier|Mateo|Elijah|Lorenzo|Gabriel|Rafael|Alon|Dante|Andres"),
      lastJoin: "space",
      lastLeft: list("Santos|Reyes|Cruz|Garcia|Mendoza|Bautista|Ramos|Flores|Aquino|Villanueva|Castillo|Navarro|Dela Cruz|Salvador|Mercado|Lim|Velasco|Soriano|de Guzman|Manalo"),
      lastRight: list("Serrano|Domingo|Rosales|Alonzo|Evangelista|Panganiban|Relucio|Pascual|Abad|Toribio"),
      nickJoin: "space",
      nickLeft: list("Balisong|Pacifico|Bagyo|Cobra|Tagalog|Maynila|Tala|Kidlat|Bakal|Dagat|Lakan|Mandirigma|Ginto|Haring|Maliksi|Sundalo|Diwa|Bulalakaw|Silakbo|Barako"),
      nickRight: list("ng Maynila|ng Bakal|Kidlat|Mandirigma|Matinik|Imortal|ng Dagat|ng Luzon|Mabangis|Walang Awa")
    }
  };

  var pools = {};
  var keys = [];
  var i;
  var countryKey;
  var seed;

  for (countryKey in seeds) {
    if (seeds.hasOwnProperty(countryKey)) {
      keys.push(countryKey);
    }
  }

  for (i = 0; i < keys.length; i += 1) {
    countryKey = keys[i];
    seed = seeds[countryKey];
    pools[countryKey] = {
      firstNames: buildPool(seed.firstLeft, seed.firstRight, seed.firstJoin),
      lastNames: buildPool(seed.lastLeft, seed.lastRight, seed.lastJoin),
      nicknames: buildNicknamePool(seed.nickLeft, seed.nickRight)
    };
  }

  return {
    pools: pools,
    seeds: seeds
  };
}());
