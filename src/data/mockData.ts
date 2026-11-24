import { DepartmentQuota, Incident, StaffMember } from '../types';
import { NIGERIA_STATE_LGAS } from './nigeriaLgas';
import engrIniobongEkpoPhoto from '../assets/images/engr_iniobong_ekpo_1795170059059.jpg';
import ekeminiUdoPhoto from '../assets/images/ekemini_udo_1795170228315.jpg';
import drUbongBasseyPhoto from '../assets/images/dr_ubong_bassey_1795170228378.jpg';

export const HOTLINKED_IMAGES = {
  engrIniobongEkpo: engrIniobongEkpoPhoto,
  ekeminiUdo: ekeminiUdoPhoto,
  drUbongBassey: drUbongBasseyPhoto,
  lagosGisMap:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBedC-C0PYZzew5wFdTuq8CpwFtj31xHDkghdT8F6euMPji44njPCVMMoPMksifA9WgVTxA8jgFwDyESUz2hPErFRTWBCrrIgUVLpl3v6HEjGP6cipQrMyNJDtnWMZxbKGHVMzlk3VJWQd7BQQoOnkRDNE3CpawgbSPUAbNbB57hhXeMS-e455d85olYosqoO1yDdEtarhJ1Yh1otlHE7ckvcREHvPMFUgvsr1W5A',
  lagosHeatmap:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCpqm3ntDKWAgVnAmo9b3KYmpChXe-z4cw4VE1_HiB4m7tcCXf78rEN8OE5WuzQeHdf7SnUjh6TIGSZKS3FGC9wGxt9nb3FtQJdDA3A7vn_5QamHS_TP7E-92Ps1-ax_DPcaT9pGW8e60MdMocoJ7fUYYw8Qnkz03g5Fa8vlwwVLMLlIJqz0XPMBRwvpFUpGzHRn2ncWFJ4IYwN0yDRcpWls365c7L1m22R_zVVJw',
  potholeCloseup:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAaWlGL-832CeY91H4zYACvHYJpybP9UINRDICpX0VzEmyz6-B0NhpbsyJyAgB3d45gn8_JFEsNb2kpgbNjmktkXyfUsVKsvx9SWstubXxF-JAYvAXc6zHTIGDI2OcFLXaTBHALwkFw1C95HQg22CYcFwdn9etORFAxDwlED6AfKtYdDZs35laKCsGjRcRIJwRhG7XBqBtCt2O7-6hqhnqi4fsxrU_Bb4NdTgAn9Q',
  potholeBeforeWork:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBQViX6XaIjiiT3FgfL67g-ZJCq_QtoeRt54SO9AaPpdObqeZz8mpRkvq-GIZlvRmzfDCSUA1aXysqIkhj60rdH9ZHzjRZMCS7SqXeUP-1U7ozSIPqnbAmuSPDSFMxEAaryJAvKEjKXlmXe1I3eNFFZFhoRypy6WA-AUS76cc4zK2syRq3Isd5WNkyEJbMVyj99ZxPRQBsJ0ZabLHBH1YB8lrWA3XMCivvg6l0hHQ',
  asphaltCrewHero:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD6UlUf7yFbJNSlY-oOW5DtAfSZLRKDOOycgf_lEbsf1WxznqYkcDvLWb8iqt5TcG53eYeoG24VY3O7ThtIKVSFOSTruzQArT0C-Tne3_xge1VFeXMELDdyR-4V2FT3qMzp6DHwhO4NGMNfqXTAkMoOb40r9cnTLkr8BnoVdMkXHbbUd81Z_0mpfVXsSDcp8b9Fby-LofeXVNLxY_CXi8L1gSoKwdqhVeD-AH5JZw',
  asphaltCrewPatch:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDPqw2lLFgqBtIxIJrxgH92BE5GDsysNj5MmfjEQDgdHL91wVX7otjrVJMuImsjYSu6JJB7C9WlqwK6iyZrLeFdzfHbKAFovsTh2NhVTYhxnO-qFw2uNTBnF0cRY_XaBobuoDXUYv4EjbEEgh5xFwmcE9jeglWnBcQLoqw4rdt560kPj1aFoK7f4Pzxj92_4kNvGv3EvOcVkVySLBVKaU8Qbj0DFx6ktijKIefmkA',
  drainageCrew:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBu_21VC1IVK70DfCPrzPbeRcHzXfTkmBozBVgsBaZ7K90cWyBW9YRBotI5coeW35KYImBZGO7rchQZ_pGcpFhb-mlGvP18ptsqdg5wbhjJi5JFIfCtNrZ2oBbjw3x1uJcBR01wRZicrhAHzwWkf8qNbOU_c2AFrhughk1y5DkIA22ItvymAeE3EB7siVLXGqZLn37vrw3RMfqEW5g_jllllq4H3L9S5_IiZUyM0w',
  drainageCanalCrew:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDIe5uUqcCX5qzGpOYwZ56C9hWCA0wpyNN2u3PUh8_K9NF6C4zHUK4zEjwbw0uQFP0Yv-1pU-fVY-dqiX6jBhQULBtTcdq7GTcQbS7loCn4iP_AFv0cYz1pR0lghYSBLyTg1sgAGujQxMlvcs0HEt9MNn8Z44aeVZ3Sa7_VzZcOCSv_9y0SLO8E6MNI6UQg58NC1QOt7EvovFrq8MzoZ27Bii9lrx8bYtGom-m7dw',
  drainageAuditStage1:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCK4kiiWI_oml7tiGl_GQy6lFyisfiY7eZY5qscPDjRNKKN7016yY-z7mK7PmVrmbgAZo6EbIrvDoheU48SBSulp6e5PCMbobK-k8WIz3WQKen69WPk-yFg3sEs64xtGRJFTw80S8zePXOmShZKJ-MSfO4w1YhIHOCxLBJKH2MUOyf4rhiKQ5GtSw_3Xov1JV7HCHecA19jmxnphkxfUG3uKIWf4_e1Ynvk1rcF2A',
  rollerStage2:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDShl9vymQDRCjmFuwjF4M-V6YDSjybaIRJ6TlOTEGpkLt7ZZjaPFyYFDHYRWtNkmiIo54n0tgwpOyeFSjiwD_Sv1uXPh5OnFZ4Vfn0Gk7V4jB0RRkknIkfpGd3wz6r5v4V2jis4upyk6kzxsRKNUP6Tyy659A3qKX5XVs8lEea80kGTjin3I1qRF8wpYc0Tnl8dKQ9bWjXEh0qdcMlOr2e8c-J7KKDtf-bMncXYQ',
  finishedRoadStriping:
    'https://lh3.googleusercontent.com/aida/ALJJyrDI1mdWbORXAE6rq5ZytD1CXOiBcR9ECi1pbhxMTaZUSLEOq221HITUhFWTU2CgT_-MZF4_jTzvNq9PwfFrvpsQt5xmfE0Nmg0P9CDiX3EQy33xAW22azM_qzxLNVQdcXoE-LR8uMCo0FjmfYd7FBhcQAIlmEIih0QGnYkKOmt90mEUjuteQ85YtLSXEVlwNWtHmJdnj0VVBDxwxCRs-D_2d4DQo9_C33rdYgBydcVF4ZAXcSxCmSC8sA',
  yabaRoadWork:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDzb7HnYLx7Nsfem8XHDftBCqUNwQ5nKMZXDBZf1f8VgRH1XIy_K7a7YAuVTMdz7sFStoZ9wrEE9R1HoNzq7q4_0JQKzyB1wXmlMBvqZMK2v22TMSKBAFP2778N2s5RdTXHNYhETq5FpP0D7X2bLd66rfuMDI2ynnXiny6JTR2iJnpWSl0sISsF8vwA1fBSpvOFw0ZbKoPAlVWYGs43sEt5slta8mY-NROxmjydzw',
  ikoyiAvatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuALUIf18Vb2STIxqzOga3qm5mRrbVX0yiC8ay0b4VF5Ydf9GwZFSWPCYeoJwMZGl89ZfwfU5IONjK092FYs6y4iFv0xpT_SRkcUqA9TyL77QsYm6ixUVNH2xr-mUdalapHXkc5hZrhPMKRQl995Wkk6PqcqOq51tOqjtLzgawYn17dHjGRp7Ps1Lsh2PlykgRXucpcMK2TuiYn-EL3XTnMEXkkpM5NNEBqA4wc9cw',
  directorAvatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAFrPMRHybPd44IUJmZot7OQ1FXgjpzq1uZJkVK4Bk_ZD5lyjDaRmyKbl3-OxXYr-CyaiN__tAumeBJoqqm5h3pFEAT0v7CxX_8E-URWCoGib-_3AhuMY0Pbv94dMUkx1KjcJyAhqyUi1kiVjOZ91JSjqlAage9P5KQAHd2WZqMQbzW0WSBRvOaZZMeULxBffJsUq7Fvuqd9x7Y_o45NsrX-1g9W7nd6RqdnZJchw',
  adminAvatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCwekFIZ020t-HeWNQal2DUjbbHiMwXSM_7yQuRO7Ldl8AQKCbArfv1UAiKQB9wd-TCGKYuQpJ1pslEU_vmdEO6iJD5FqoF7o3uu02qGWSCnrB4llmpmNDLRc9YBuF-uTL6ih3BVGToXzivKMXYLiAXJHvRHeNoQIXfsvjulAz_PmZXJOcPTr8WvRJFRBUYPXbTeV93KVGJXM4gvOT1jbZWSCgrTK1RyQ2vkHqF9g',
};

export const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  akwa_ibom: { lat: 5.0377, lng: 7.9128 },
  lagos: { lat: 6.5244, lng: 3.3792 },
  abuja: { lat: 9.0765, lng: 7.3986 },
  rivers: { lat: 4.8156, lng: 7.0498 },
  kano: { lat: 12.0022, lng: 8.592 },
  oyo: { lat: 7.3775, lng: 3.947 },
  enugu: { lat: 6.4584, lng: 7.5464 },
  kaduna: { lat: 10.5105, lng: 7.4165 },
  delta: { lat: 6.2059, lng: 6.6959 },
  edo: { lat: 6.335, lng: 5.6037 },
  cross_river: { lat: 4.9757, lng: 8.3417 },
  anambra: { lat: 6.2209, lng: 7.0722 },
  abia: { lat: 5.5249, lng: 7.4946 },
  ogun: { lat: 7.1475, lng: 3.3619 },
  imo: { lat: 5.4836, lng: 7.0333 },
  plateau: { lat: 9.8965, lng: 8.8583 },
};

export interface StateCadastre {
  name: string;
  lgas: Record<
    string,
    {
      name: string;
      dispatch: string;
      wards: string[];
      streets: string[];
    }
  >;
}

const BASE_CADASTRE: Record<string, StateCadastre> = {
  abia: {
    name: 'Abia State',
    lgas: {
      umuahia_north: {
        name: 'Umuahia North LGA',
        dispatch: 'Abia State Public Works Depot (Umuahia)',
        wards: ['Ibeku Central Ward', 'Afugiri / Ohuhu', 'World Bank Housing Axis'],
        streets: ['Aba Road', 'Bende Road', 'Bank Road', 'Ikot Ekpene Road'],
      },
      aba_north: {
        name: 'Aba North LGA',
        dispatch: 'Aba Commercial Corridor Works Unit',
        wards: ['Ariaria Market Ward', 'Eziama Ward', 'Ogbor Hill'],
        streets: ['Faulks Road', 'Azikiwe Road', 'Asa Road', 'Brass Street'],
      },
      aba_south: {
        name: 'Aba South LGA',
        dispatch: 'Aba South Drainage & Roads Team',
        wards: ['Enyimba Ward', 'Ngwa Road Axis', 'Ohazu Ward'],
        streets: ['Ngwa Road', 'Port Harcourt Road', 'Cemetery Road'],
      },
    },
  },
  adamawa: {
    name: 'Adamawa State',
    lgas: {
      yola_north: {
        name: 'Yola North LGA',
        dispatch: 'Adamawa Works Command (Jimeta)',
        wards: ['Jimeta Central', 'Doubeli Ward', 'Karewa Ward'],
        streets: ['Atiku Abubakar Way', 'Galadima Aminu Way', 'Ahmadu Bello Way'],
      },
      yola_south: {
        name: 'Yola South LGA',
        dispatch: 'Yola South Municipal Depot',
        wards: ['Makama A', 'Adarawo Ward', 'Namtari'],
        streets: ['Yola-Numan Road', 'Modibbo Adama Way', 'Lamido Aliyu Way'],
      },
      mubi_north: {
        name: 'Mubi North LGA',
        dispatch: 'Mubi Northern Zone Works',
        wards: ['Lokuwa Ward', 'Sabon Layi', 'Kolere'],
        streets: ['Mubi-Gella Road', 'Ahmadu Bello Street', 'Market Road'],
      },
    },
  },
  akwa_ibom: {
    name: 'Akwa Ibom State',
    lgas: {
      uyo: {
        name: 'Uyo LGA',
        dispatch: 'Akwa Ibom Roads & Maintenance Agency (AKRMA)',
        wards: ['Uyo Urban Ward 1', 'Ewet Housing Estate', 'Shelter Afrique', 'Itam / Ikot Ekpene Axis'],
        streets: ['Oron Road', 'Abak Road', 'Ikot Ekpene Road', 'Nwaniba Road', 'Atiku Abubakar Way', 'Aka Road'],
      },
      eket: {
        name: 'Eket LGA',
        dispatch: 'Eket Zonal Public Works',
        wards: ['Urban I Ward', 'Afaha Eket', 'Idua', 'Okon Eket'],
        streets: ['Eket-Oron Road', 'Marina Road', 'Grace Bill Road', 'Liverpool Road'],
      },
      ikot_ekpene: {
        name: 'Ikot Ekpene LGA',
        dispatch: 'Raffia City Works Depot',
        wards: ['Ikot Ekpene Urban', 'Amanyam', 'Abiakpo'],
        streets: ['Aba Road', 'Aldershot Road', 'Chubb Road', 'Sanni Ogun Road'],
      },
      oron: {
        name: 'Oron LGA',
        dispatch: 'Oron Coastal Infrastructure Unit',
        wards: ['Oron Urban I', 'Uya Oro', 'Idua Assang'],
        streets: ['Oron Beach Road', 'Mary Hanney Road', 'Uyo-Oron Highway'],
      },
      ibeno: {
        name: 'Ibeno LGA',
        dispatch: 'Ibeno Coastal & Drainage Depot',
        wards: ['Upenekang Ward', 'Ukpenekang Coastal', 'Mkpanak'],
        streets: ['Mobil Terminal Road', 'Upenekang Boulevard', 'Ibeno Coastal Link'],
      },
    },
  },
  anambra: {
    name: 'Anambra State',
    lgas: {
      awka_south: {
        name: 'Awka South LGA',
        dispatch: 'ARTMA & Anambra Works Command',
        wards: ['Awka Central Ward', 'Amawbia', 'Okpuno'],
        streets: ['Zik Avenue', 'Enugu-Onitsha Expressway', 'Arthur Eze Avenue'],
      },
      onitsha_north: {
        name: 'Onitsha North LGA',
        dispatch: 'Onitsha Urban Infrastructure Depot',
        wards: ['GRA Phase 1', 'Inland Town', 'Odoakpu'],
        streets: ['Awka Road', 'Old Market Road', 'Limca Road', 'New Market Road'],
      },
      nnewi_north: {
        name: 'Nnewi North LGA',
        dispatch: 'Nnewi Industrial Works Unit',
        wards: ['Otolo Ward', 'Uruagu', 'Umudim'],
        streets: ['Nkwo Nnewi Road', 'Owerri Road', 'Igwe Orizu Road'],
      },
    },
  },
  bauchi: {
    name: 'Bauchi State',
    lgas: {
      bauchi: {
        name: 'Bauchi LGA',
        dispatch: 'Bauchi Metropolitan Works Yard',
        wards: ['Makama Sarkin Baki', 'Dan Iya Ward', 'Dawaki'],
        streets: ['Maiduguri Road', 'Ran Road', 'Ahmadu Bello Way', 'Yandoka Road'],
      },
      katagum: {
        name: 'Katagum LGA (Azare)',
        dispatch: 'Azare Zonal Engineering Unit',
        wards: ['Nasarawa B', 'Madangala', 'Tsakuwa'],
        streets: ['Kano-Maiduguri Highway', 'Jama’are Road', 'Emir Palace Road'],
      },
    },
  },
  bayelsa: {
    name: 'Bayelsa State',
    lgas: {
      yenagoa: {
        name: 'Yenagoa LGA',
        dispatch: 'Bayelsa State Direct Labour Agency',
        wards: ['Opolo / Kpansia', 'Amarata Ward', 'Ekeki / Okaka'],
        streets: ['Melford Okilo Road', 'Isaac Boro Expressway', 'Azikoro Road'],
      },
      ogbia: {
        name: 'Ogbia LGA',
        dispatch: 'Ogbia Coastal Drainage Unit',
        wards: ['Otuoke Ward', 'Ogbia Town', 'Imiringi'],
        streets: ['Otuoke University Road', 'Elebele-Emeyal Road'],
      },
    },
  },
  benue: {
    name: 'Benue State',
    lgas: {
      makurdi: {
        name: 'Makurdi LGA',
        dispatch: 'Benue Urban Works & Drainage',
        wards: ['High Level Ward', 'Wadata Ward', 'North Bank'],
        streets: ['Kashim Ibrahim Road', 'Gboko Road', 'Otukpo Road', 'Old Lafia Road'],
      },
      gboko: {
        name: 'Gboko LGA',
        dispatch: 'Gboko Municipal Maintenance Yard',
        wards: ['Gboko Central', 'Gboko South', 'Mkar'],
        streets: ['J.S. Tarka Way', 'Aliade Road', 'Capt. Downes Road'],
      },
    },
  },
  borno: {
    name: 'Borno State',
    lgas: {
      maiduguri: {
        name: 'Maiduguri Metropolitan (MMC)',
        dispatch: 'Borno State Works & Reconstruction',
        wards: ['Shehuri North', 'Bolori I', 'Gwange Ward'],
        streets: ['Sir Kashim Ibrahim Way', 'Bama Road', 'Damaturu Road', 'Ahmadu Bello Way'],
      },
      jere: {
        name: 'Jere LGA',
        dispatch: 'Jere Zonal Maintenance Depot',
        wards: ['Mairi Ward', 'Old Maiduguri', 'Gomari'],
        streets: ['Dikwa Road', 'University of Maiduguri Road'],
      },
    },
  },
  cross_river: {
    name: 'Cross River State',
    lgas: {
      calabar_municipal: {
        name: 'Calabar Municipal LGA',
        dispatch: 'Calabar Urban Renewal & Works',
        wards: ['State Housing Estate', 'Ikot Ansa', 'Marian Ward'],
        streets: ['Marian Road', 'Murtala Muhammed Highway', 'Ndidem Usang Iso Road'],
      },
      calabar_south: {
        name: 'Calabar South LGA',
        dispatch: 'Calabar South Drainage Squad',
        wards: ['Anantigha', 'Henshaw Town', 'Duke Town'],
        streets: ['Goldie Street', 'Calabar Road', 'Atamunu Street'],
      },
    },
  },
  delta: {
    name: 'Delta State',
    lgas: {
      oshamili_south: {
        name: 'Oshimili South LGA (Asaba)',
        dispatch: 'Delta State Direct Labour Agency (Asaba)',
        wards: ['Asaba Cable Point', 'Okpanam Axis', 'GRA Core'],
        streets: ['Nnebisi Road', 'Okpanam Road', 'Summit Road', 'Benin-Asaba Expressway'],
      },
      warri_south: {
        name: 'Warri South LGA',
        dispatch: 'Warri Metropolitan Roads & Drainage',
        wards: ['GRA Warri', 'Enerhen / Airport', 'Okumagba'],
        streets: ['Effurun-Sapele Road', 'Airport Road', 'NPA Expressway'],
      },
      uvwie: {
        name: 'Uvwie LGA (Effurun)',
        dispatch: 'Effurun Rapid Maintenance Unit',
        wards: ['Effurun Central', 'PTI Axis', 'Ekpan'],
        streets: ['Jakpa Road', 'PTI Road', 'Refinery Road'],
      },
    },
  },
  ebonyi: {
    name: 'Ebonyi State',
    lgas: {
      abakaliki: {
        name: 'Abakaliki LGA',
        dispatch: 'Ebonyi Ministry of Works Depot',
        wards: ['Azuiyiokwu', 'Kpirikpiri', 'Abakpa'],
        streets: ['Ogoja Road', 'Enugu-Abakaliki Expressway', 'Water Works Road'],
      },
      afikpo_north: {
        name: 'Afikpo North LGA',
        dispatch: 'Afikpo Zonal Public Works',
        wards: ['Ehugbo Central', 'Ozizza', 'Unwana'],
        streets: ['Eke Market Road', 'Amasiri-Okigwe Road'],
      },
    },
  },
  edo: {
    name: 'Edo State',
    lgas: {
      oredo: {
        name: 'Oredo LGA (Benin City)',
        dispatch: 'Edo Public Works Agency (Ring Road)',
        wards: ['Benin GRA Ward', 'New Benin', 'Ogbe / Ring Road'],
        streets: ['Sapele Road', 'Airport Road', 'Akpakpava Street', 'Mission Road'],
      },
      egor: {
        name: 'Egor LGA',
        dispatch: 'Uselu & Ugbowo Works Depot',
        wards: ['Uselu Ward', 'Ugbowo', 'Uwelu'],
        streets: ['Lagos-Benin Expressway', 'Technical College Road', 'Textile Mill Road'],
      },
      etsako_west: {
        name: 'Etsako West LGA (Auchi)',
        dispatch: 'Auchi Zonal Works Unit',
        wards: ['Auchi Urban', 'Jattu', 'South Ibie'],
        streets: ['Igbei Road', 'Benin-Okene Highway'],
      },
    },
  },
  ekiti: {
    name: 'Ekiti State',
    lgas: {
      ado_ekiti: {
        name: 'Ado-Ekiti LGA',
        dispatch: 'EKROMA Road Maintenance Agency',
        wards: ['Ijigbo / Okesa', 'Basiri Ward', 'Fajuyi / GRA'],
        streets: ['Bank Road', 'Iworoko Road', 'Ikere Road', 'Adebayo Road'],
      },
      ikere: {
        name: 'Ikere-Ekiti LGA',
        dispatch: 'Ikere Zonal Engineering Yard',
        wards: ['Oke-Ikere', 'Uro / Odo-Oja'],
        streets: ['Ado-Akure Road', 'Oke-Osun Street'],
      },
    },
  },
  enugu: {
    name: 'Enugu State',
    lgas: {
      enugu_north: {
        name: 'Enugu North LGA',
        dispatch: 'Enugu State Public Works (Independence Layout)',
        wards: ['Independence Layout', 'New Haven', 'GRA Enugu'],
        streets: ['Ogui Road', 'Chime Avenue', 'Okpara Avenue', 'Presidential Road'],
      },
      enugu_south: {
        name: 'Enugu South LGA',
        dispatch: 'Uwani & Achara Works Unit',
        wards: ['Uwani Central', 'Achara Layout', 'Maryland'],
        streets: ['Agbani Road', 'Zik Avenue', 'Kenyatta Street'],
      },
      nsukka: {
        name: 'Nsukka LGA',
        dispatch: 'Nsukka Zonal Works Depot',
        wards: ['University Ward', 'Odenigbo', 'Ibagwa'],
        streets: ['Obollo Road', 'Enugu Road', 'University Market Road'],
      },
    },
  },
  abuja: {
    name: 'FCT Abuja',
    lgas: {
      amac: {
        name: 'AMAC Municipal',
        dispatch: 'FCDA Infrastructure Maintenance Unit',
        wards: ['Central Business District', 'Wuse II', 'Garki II', 'Maitama / Asokoro'],
        streets: ['Shehu Shagari Way', 'Aminu Kano Crescent', 'Ahmadu Bello Way', 'Adetokunbo Ademola Crescent'],
      },
      bwari: {
        name: 'Bwari Area Council',
        dispatch: 'Bwari Zonal Public Works',
        wards: ['Kubwa Ward', 'Dutse Alhaji', 'Bwari Central'],
        streets: ['Arab Road', 'Kubwa Expressway', 'Gado Nasko Way'],
      },
      gwagwalada: {
        name: 'Gwagwalada Area Council',
        dispatch: 'Gwagwalada Satellite Works Depot',
        wards: ['Gwagwalada Central', 'Phase 1-3', 'Kutunku'],
        streets: ['Lokoja-Kaduna Highway', 'Specialist Hospital Road'],
      },
    },
  },
  gombe: {
    name: 'Gombe State',
    lgas: {
      gombe: {
        name: 'Gombe LGA',
        dispatch: 'Gombe Urban Infrastructure Depot',
        wards: ['Pantami Ward', 'Bolari East', 'Jekadafari'],
        streets: ['Bauchi Road', 'Biu Road', 'Gombe Bypass', 'Commercial Layout'],
      },
      billiri: {
        name: 'Billiri LGA',
        dispatch: 'Gombe South Maintenance Unit',
        wards: ['Billiri North', 'Tanglang'],
        streets: ['Gombe-Yola Highway', 'Market Square Road'],
      },
    },
  },
  imo: {
    name: 'Imo State',
    lgas: {
      owerri_municipal: {
        name: 'Owerri Municipal LGA',
        dispatch: 'ENTRACO & Imo Road Maintenance Unit',
        wards: ['Ikenegbu Layout', 'Aladinma', 'World Bank'],
        streets: ['Wetheral Road', 'Okigwe Road', 'Douglas Road', 'Assumpta Avenue'],
      },
      owerri_west: {
        name: 'Owerri West LGA',
        dispatch: 'Owerri West Works Depot',
        wards: ['Umuguma', 'Nekede', 'Ihiagwa'],
        streets: ['Port Harcourt Road', 'Nekede-Ihiagwa Road'],
      },
    },
  },
  jigawa: {
    name: 'Jigawa State',
    lgas: {
      dutse: {
        name: 'Dutse LGA',
        dispatch: 'Jigawa Road Maintenance Agency (JIRMA)',
        wards: ['Takur Ward', 'Gida Dubu', 'Limawa'],
        streets: ['Ibrahim Aliyu Bypass', 'Sani Abacha Way', 'Kiyawa Road'],
      },
      hadejia: {
        name: 'Hadejia LGA',
        dispatch: 'Hadejia Zonal Works Yard',
        wards: ['Matsaro', 'Kasuwar Kuda'],
        streets: ['Nguru Road', 'Emir Palace Road'],
      },
    },
  },
  kaduna: {
    name: 'Kaduna State',
    lgas: {
      kaduna_north: {
        name: 'Kaduna North LGA',
        dispatch: 'KADRA & Kaduna Metro Works',
        wards: ['Ungwan Rimi', 'Kawo Ward', 'Malali / GRA'],
        streets: ['Ahmadu Bello Way', 'Ali Akilu Road', 'Constitution Road', 'Isa Kaita Road'],
      },
      kaduna_south: {
        name: 'Kaduna South LGA',
        dispatch: 'Barnawa & Makera Maintenance Unit',
        wards: ['Barnawa Ward', 'Kakuri', 'Sabon Tasha'],
        streets: ['Nnamdi Azikiwe Expressway', 'Kachia Road', 'Junction Road'],
      },
      zaria: {
        name: 'Zaria LGA',
        dispatch: 'Zaria Zonal Engineering Command',
        wards: ['Samaru', 'Sabon Gari', 'Tudun Wada'],
        streets: ['Sokoto Road', 'PZ-Kongo Road'],
      },
    },
  },
  kano: {
    name: 'Kano State',
    lgas: {
      kano_municipal: {
        name: 'Kano Municipal LGA',
        dispatch: 'Kano Urban Planning & Works (KAROTA)',
        wards: ['Fagge Ward', 'Nassarawa Ward', 'Dala Ward'],
        streets: ['Bompai Road', 'Murtala Mohammed Way', 'State Road', 'Ibrahim Taiwo Road'],
      },
      nassarawa: {
        name: 'Nassarawa LGA',
        dispatch: 'Kano Nassarawa GRA Works Unit',
        wards: ['Hotoro North', 'Giginyu', 'Gawuna'],
        streets: ['Ahmadu Bello Way', 'Zaria Road', 'Lodge Road'],
      },
    },
  },
  katsina: {
    name: 'Katsina State',
    lgas: {
      katsina: {
        name: 'Katsina LGA',
        dispatch: 'Katsina State Road Maintenance (KASROMA)',
        wards: ['Kofar Kaura', 'GRA Katsina', 'Wakilin Kudu'],
        streets: ['Ibrahim Babangida Way', 'Kano-Katsina Road', 'Yahaya Madaki Way'],
      },
      funtua: {
        name: 'Funtua LGA',
        dispatch: 'Funtua Zonal Works Depot',
        wards: ['Sabon Gari', 'Dandutse'],
        streets: ['Zaria-Sokoto Road', 'Yashe Road'],
      },
    },
  },
  kebbi: {
    name: 'Kebbi State',
    lgas: {
      birnin_kebbi: {
        name: 'Birnin Kebbi LGA',
        dispatch: 'Kebbi State Works Command',
        wards: ['Gwadangaji', 'Nassarawa I', 'Badariya'],
        streets: ['Emir Haruna Rasheed Road', 'Sani Abacha Bypass', 'Ahmadu Bello Way'],
      },
      argungu: {
        name: 'Argungu LGA',
        dispatch: 'Argungu Zonal Maintenance Unit',
        wards: ['Kokani', 'Galadima'],
        streets: ['Sokoto-Birnin Kebbi Road'],
      },
    },
  },
  kogi: {
    name: 'Kogi State',
    lgas: {
      lokoja: {
        name: 'Lokoja LGA',
        dispatch: 'Kogi Road Maintenance Agency (KOGROMA)',
        wards: ['Lokongoma', 'Adankolo', 'Ganaja'],
        streets: ['Murtala Muhammed Way', 'Ganaja-Ajaokuta Road', 'Ibrahim Babangida Road'],
      },
      okene: {
        name: 'Okene LGA',
        dispatch: 'Kogi Central Works Depot',
        wards: ['Bariki', 'Obehira'],
        streets: ['Okene-Lokoja Highway', 'Auchi Road'],
      },
    },
  },
  kwara: {
    name: 'Kwara State',
    lgas: {
      ilorin_west: {
        name: 'Ilorin West LGA',
        dispatch: 'Kwara Road Maintenance Agency (KWARMA)',
        wards: ['Adewole Ward', 'Alanamu', 'Oloje'],
        streets: ['Ahmadu Bello Way', 'Unity Road', 'Taiwo Road', 'Ibrahim Taiwo Road'],
      },
      ilorin_south: {
        name: 'Ilorin South LGA',
        dispatch: 'Tanke & GRA Works Unit',
        wards: ['GRA Ilorin', 'Tanke / Oke-Odo', 'Fufu'],
        streets: ['University Road', 'Asa Dam Road', 'Fate Road'],
      },
    },
  },
  lagos: {
    name: 'Lagos State',
    lgas: {
      ikeja: {
        name: 'Ikeja LGA',
        dispatch: 'Ikeja Central Public Works',
        wards: [
          'Ward 04 (Allen / Opebi Corridor)',
          'Ward 01 (Alausa / Secretariat)',
          'Onigbongbo LCDA (Maryland / Mobolaji)',
          'Ojodu LCDA (Agidingbi / Berger)',
          'Ward 02 (Anifowoshe / Ikeja GRA)',
        ],
        streets: [
          'Mobolaji Bank Anthony Way',
          'Allen Avenue',
          'Isaac John Street',
          'Toyin Street',
          'Obafemi Awolowo Way',
          'Oba Akran Avenue',
          'Opebi Road',
          'Aromire Avenue',
          'Kodesoh Street',
          'Secretariat Road',
        ],
      },
      surulere: {
        name: 'Surulere LGA',
        dispatch: 'Surulere Municipal Works Depot',
        wards: [
          'Surulere Central (Bode Thomas / Adeniran)',
          'Coker-Aguda LCDA',
          'Itire-Ikate LCDA',
          'Iponri Axis',
        ],
        streets: [
          'Adeniran Ogunsanya Street',
          'Bode Thomas Street',
          'Ogunlana Drive',
          'Akerele Street',
          'Funsho Williams Avenue',
        ],
      },
      eti_osa: {
        name: 'Eti-Osa LGA',
        dispatch: 'Eti-Osa Coastal & Drainage Unit',
        wards: [
          'Victoria Island West',
          'Lekki Phase 1 / Admiralty',
          'Ikoyi / Obalende LCDA',
          'Eti-Osa East LCDA (Ajah)',
        ],
        streets: [
          'Ozumba Mbadiwe Avenue',
          'Admiralty Way',
          'Adeola Odeku Street',
          'Ahmadu Bello Way',
          'Bourdillon Road',
        ],
      },
      lagos_mainland: {
        name: 'Lagos Mainland LGA',
        dispatch: 'Mainland & Yaba Works Command',
        wards: ['Yaba / Abule Ijesha', 'Oyingbo / Otto', 'Ebute Metta West', 'Akoka / Unilag Axis'],
        streets: [
          'Herbert Macaulay Way',
          'Commercial Avenue',
          'Murtala Muhammed Way',
          'Ikorodu Road',
          'University Road',
        ],
      },
      alimosho: {
        name: 'Alimosho LGA',
        dispatch: 'Alimosho Heavy Drainage Command',
        wards: ['Egbeda / Akowonjo LCDA', 'Idimu / Isheri Olofin LCDA', 'Igando / Ikotun LCDA'],
        streets: ['Akowonjo Road', 'Egbeda-Idimu Road', 'LASU-Iba Expressway', 'Shasha Road'],
      },
    },
  },
  nasarawa: {
    name: 'Nasarawa State',
    lgas: {
      lafia: {
        name: 'Lafia LGA',
        dispatch: 'Nasarawa State Works Yard (Lafia)',
        wards: ['Makama Ward', 'Shinge', 'Chiroma'],
        streets: ['Jos Road', 'Makurdi Road', 'Shendam Road'],
      },
      karu: {
        name: 'Karu LGA (Mararaba)',
        dispatch: 'Mararaba-Nyanya Corridor Unit',
        wards: ['Mararaba Gurku', 'Masaka', 'New Karu'],
        streets: ['Abuja-Keffi Expressway', 'Aso Pada Road'],
      },
    },
  },
  niger: {
    name: 'Niger State',
    lgas: {
      chanchaga: {
        name: 'Chanchaga LGA (Minna)',
        dispatch: 'Niger State Road Maintenance (NIGROMA)',
        wards: ['Minna Central', 'Tunga South', 'Limawa'],
        streets: ['Bosso Road', 'Paiko Road', 'Western Bypass', 'Shiroro Road'],
      },
      suleja: {
        name: 'Suleja LGA',
        dispatch: 'Suleja Urban Works Depot',
        wards: ['Bagama', 'Iku South', 'Maje'],
        streets: ['Suleja-Madalla Road', 'Hassan Dalhatu Road'],
      },
    },
  },
  ogun: {
    name: 'Ogun State',
    lgas: {
      abeokuta_south: {
        name: 'Abeokuta South LGA',
        dispatch: 'OGROMA Public Works (Oke-Mosan)',
        wards: ['Ibara / Oke-Ilewo', 'Kuto', 'Ake'],
        streets: ['Lalubu Street', 'Ibrahim Babangida Boulevard', 'Abiola Way'],
      },
      ado_odo_ota: {
        name: 'Ado-Odo / Ota LGA',
        dispatch: 'Sango-Ota Industrial Works Unit',
        wards: ['Ota Ward I', 'Sango', 'Ijoko'],
        streets: ['Lagos-Abeokuta Expressway', 'Idiroko Road', 'Ilogbo Road'],
      },
      sagamu: {
        name: 'Sagamu LGA',
        dispatch: 'Sagamu Interchange Works Yard',
        wards: ['Makun', 'Offin', 'Sabo'],
        streets: ['Lagos-Ibadan Expressway', 'Akarigbo Street'],
      },
    },
  },
  ondo: {
    name: 'Ondo State',
    lgas: {
      akure_south: {
        name: 'Akure South LGA',
        dispatch: 'Ondo State Direct Labour (Akure)',
        wards: ['Alagbaka / GRA', 'Oba Adesida', 'Ijapo Estate'],
        streets: ['Oba Adesida Road', 'Oyemekun Road', 'Owo-Ilesa Expressway', 'Alagbaka Road'],
      },
      ondo_west: {
        name: 'Ondo West LGA',
        dispatch: 'Ondo Town Zonal Depot',
        wards: ['Yaba', 'Enuowa'],
        streets: ['Brig. Ademulegun Road', 'Ondo-Ore Road'],
      },
    },
  },
  osun: {
    name: 'Osun State',
    lgas: {
      osogbo: {
        name: 'Osogbo LGA',
        dispatch: 'ORAMP & Osun Works Command',
        wards: ['Oke-Fia', 'Olaiya / Alekuwodo', 'Ataoja'],
        streets: ['Gbongan-Osogbo Road', 'Oba Adesoji Aderemi Way', 'Station Road'],
      },
      ife_central: {
        name: 'Ife Central LGA',
        dispatch: 'Ile-Ife Municipal Works Unit',
        wards: ['OAU Campus Axis', 'Enuwa', 'Moore'],
        streets: ['Ibadan-Ife Expressway', 'Mayfair-Lagere Road'],
      },
    },
  },
  oyo: {
    name: 'Oyo State',
    lgas: {
      ibadan_north: {
        name: 'Ibadan North LGA',
        dispatch: 'Ibadan Metropolitan Works Depot',
        wards: ['Bodija / Agodi Ward', 'Sango / Mokola', 'UI / Agbowo Ward'],
        streets: ['Secretariat Road', 'Queen Elizabeth Road', 'Bodija Express', 'Mokola Hill Road'],
      },
      ibadan_south_west: {
        name: 'Ibadan South-West LGA',
        dispatch: 'Ring Road & Challenge Works Unit',
        wards: ['Ring Road / Oluyole', 'Challenge', 'Oke-Ado'],
        streets: ['MKO Abiola Way', 'Obafemi Awolowo Stadium Road', 'Lagos-Ibadan Bypass'],
      },
    },
  },
  plateau: {
    name: 'Plateau State',
    lgas: {
      jos_north: {
        name: 'Jos North LGA',
        dispatch: 'Jos Metropolitan Development Board (JMDB)',
        wards: ['Tudun Wada', 'Gangare', 'Naraguta / Bauchi Rd'],
        streets: ['Ahmadu Bello Way', 'Bauchi Road', 'Zaria Road', 'Murtala Muhammed Way'],
      },
      jos_south: {
        name: 'Jos South LGA (Bukuru)',
        dispatch: 'Bukuru & Rayfield Maintenance Yard',
        wards: ['Rayfield / Du', 'Bukuru', 'Gyel'],
        streets: ['Yakubu Gowon Way', 'Bukuru Express', 'Rayfield Road'],
      },
    },
  },
  rivers: {
    name: 'Rivers State',
    lgas: {
      port_harcourt: {
        name: 'Port Harcourt LGA',
        dispatch: 'Port Harcourt City Works Authority',
        wards: ['Old GRA Ward', 'Diobu Mile 1-3', 'D-Line Axis'],
        streets: ['Aba Road', 'Olu Obasanjo Road', 'Ikwerre Road', 'Trans-Amadi Boulevard'],
      },
      obio_akpor: {
        name: 'Obio-Akpor LGA',
        dispatch: 'Obio-Akpor Rapid Roads Squad',
        wards: ['Rumuola / Rumuokoro', 'Eliozu', 'Choba / Uniport'],
        streets: ['East-West Road', 'Ada George Road', 'Peter Odili Road'],
      },
    },
  },
  sokoto: {
    name: 'Sokoto State',
    lgas: {
      sokoto_north: {
        name: 'Sokoto North LGA',
        dispatch: 'Sokoto State Works & Transport Depot',
        wards: ['Magajin Gari', 'Sarkin Zamfara', 'Waziri A'],
        streets: ['Ahmadu Bello Way', 'Sultan Abubakar Road', 'Kano Road'],
      },
      sokoto_south: {
        name: 'Sokoto South LGA',
        dispatch: 'Sokoto South Maintenance Unit',
        wards: ['Gagi', 'Rijiya'],
        streets: ['Maiduguri Road', 'Gusau Road'],
      },
    },
  },
  taraba: {
    name: 'Taraba State',
    lgas: {
      jalingo: {
        name: 'Jalingo LGA',
        dispatch: 'Taraba Road Maintenance Agency (TARMA)',
        wards: ['Sintali', 'Turaki', 'Kona'],
        streets: ['Hammaruwa Way', 'Jalingo-Wukari Road', 'Palace Way'],
      },
      wukari: {
        name: 'Wukari LGA',
        dispatch: 'Wukari Southern Zone Depot',
        wards: ['Avyi', 'Hospital Ward'],
        streets: ['Ibi Road', 'Takum Road'],
      },
    },
  },
  yobe: {
    name: 'Yobe State',
    lgas: {
      damaturu: {
        name: 'Damaturu LGA',
        dispatch: 'Yobe State Road Maintenance Agency',
        wards: ['Nayinawa', 'Bindigari', 'Gwange'],
        streets: ['Gashua Road', 'Maiduguri-Potiskum Highway', 'Gujba Road'],
      },
      potiskum: {
        name: 'Potiskum LGA',
        dispatch: 'Potiskum Commercial Works Unit',
        wards: ['Bolewa', 'Dogo Nini'],
        streets: ['Kano-Maiduguri Highway', 'Mohammed Idrissa Way'],
      },
    },
  },
  zamfara: {
    name: 'Zamfara State',
    lgas: {
      gusau: {
        name: 'Gusau LGA',
        dispatch: 'Zamfara Road Maintenance Agency (ZAROMA)',
        wards: ['Tudun Wada', 'Sabon Gari', 'Galadima'],
        streets: ['Sokoto-Zaria Highway', 'Canteen Area Road', 'Sani Abacha Way'],
      },
      kaura_namoda: {
        name: 'Kaura Namoda LGA',
        dispatch: 'Kaura Namoda Zonal Depot',
        wards: ['Sarkin Baura', 'Dan Isa'],
        streets: ['Gusau-Shinkafi Road'],
      },
    },
  },
};

const normalizeLgaName = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\b(lga|area council|municipal)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const toSlugKey = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const NIGERIAN_CADASTRE: Record<string, StateCadastre> = Object.fromEntries(
  Object.entries(BASE_CADASTRE).map(([stateKey, stateObj]) => {
    const mergedLgas: StateCadastre['lgas'] = { ...stateObj.lgas };
    const existingNormalized = new Set(
      Object.values(stateObj.lgas).map((lga) => normalizeLgaName(lga.name))
    );
    const officialList = NIGERIA_STATE_LGAS[stateKey] || [];

    for (const rawLga of officialList) {
      const norm = normalizeLgaName(rawLga);
      if (existingNormalized.has(norm)) continue;
      const slug = toSlugKey(rawLga);
      const suffix = stateKey === 'abuja' ? 'Area Council' : 'LGA';
      const displayName = /\b(LGA|Area Council|Municipal)\b/i.test(rawLga)
        ? rawLga
        : `${rawLga} ${suffix}`;
      mergedLgas[slug] = {
        name: displayName,
        dispatch: `${stateObj.name} Works Desk (${rawLga})`,
        wards: ['Ward 1 (Central)', 'Ward 2 (Urban)', 'Ward 3 (Perimeter)'],
        streets: ['Main Township Road', 'Market Road', 'Secretariat Avenue'],
      };
    }

    const sortedLgas = Object.fromEntries(
      Object.entries(mergedLgas).sort(([, a], [, b]) =>
        a.name.localeCompare(b.name)
      )
    );

    return [
      stateKey,
      {
        ...stateObj,
        lgas: sortedLgas,
      },
    ];
  })
);

export function getCadastreLgaOptions(
  stateNameFilter: string,
  extraLgas: string[] = []
): { value: string; label: string }[] {
  if (stateNameFilter !== 'all') {
    const entry = Object.values(NIGERIAN_CADASTRE).find(
      (s) => s.name === stateNameFilter
    );
    const cadastreNames = entry
      ? Object.values(entry.lgas).map((l) => l.name)
      : [];
    const merged = Array.from(new Set([...cadastreNames, ...extraLgas])).sort(
      (a, b) => a.localeCompare(b)
    );
    return merged.map((name) => ({ value: name, label: name }));
  }

  const options: { value: string; label: string }[] = [];
  const seenValues = new Set<string>();

  for (const stateObj of Object.values(NIGERIAN_CADASTRE)) {
    const shortState = stateObj.name.replace(/\s+State$/i, '');
    for (const lgaObj of Object.values(stateObj.lgas)) {
      if (!seenValues.has(lgaObj.name)) {
        seenValues.add(lgaObj.name);
        options.push({
          value: lgaObj.name,
          label: `${lgaObj.name} (${shortState})`,
        });
      }
    }
  }

  for (const extra of extraLgas) {
    if (extra && !seenValues.has(extra)) {
      seenValues.add(extra);
      options.push({ value: extra, label: extra });
    }
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    refCode: 'STF-2026-004892',
    title: 'Deep Crater Pothole & Sub-base Subsidence',
    category: 'Pothole / Road Failure',
    description:
      'Heavy structural failure across westbound fast lane near Ibom Plaza / Oron Road junction. Severe axle damage hazard and traffic bottleneck.',
    state: 'Akwa Ibom State',
    lga: 'Uyo LGA',
    ward: 'Uyo Urban Ward 1',
    address: 'Plot 14 Oron Road, opposite Ibom Plaza',
    landmark: '120m South of Ibom Connection Roundabout',
    lat: '5.0377° N',
    lng: '7.9128° E',
    status: 'in_progress',
    severity: 'critical',
    reportedAt: '35 mins ago',
    slaRemainingHours: 18,
    slaLabel: '18h : 24m',
    confirmations: 34,
    reporterName: 'Nsikak Udoh',
    reporterVerified: true,
    assignedUnit: 'AKRMA Squad 4',
    assignedDepot: 'Uyo Central Yard (AKRMA)',
    squadLead: 'Engr. Iniobong Ekpo',
    beforePhotoUrl: HOTLINKED_IMAGES.potholeBeforeWork,
    progressPhotoUrl: HOTLINKED_IMAGES.rollerStage2,
    exifVerified: true,
    distanceKm: 1.4,
    materialsAsphaltTons: 2.8,
    crewHours: 3.5,
    comments: [
      {
        id: 'c-1',
        author: 'Engr. I. Ekpo (Squad Lead, Uyo Depot 4)',
        role: 'Field Squad Lead',
        isOfficial: true,
        timestamp: 'Today 10:45 AM',
        text: 'Sub-base excavation completed. 14 metric tonnes of binder asphalt delivered by AKRMA truck. Traffic diversion active around Ibom Plaza.',
      },
      {
        id: 'c-2',
        author: 'Ekemini A.',
        role: 'Verified Resident',
        isOfficial: false,
        timestamp: 'Today 09:12 AM',
        text: 'Can confirm work crew arrived with roller and safety signs. Traffic is moving smoothly through the single open lane.',
      },
    ],
  },
  {
    id: 'inc-2',
    refCode: 'STF-2026-004889',
    title: 'Blocked Stormwater Culvert & Flash Flood Overflow',
    category: 'Blocked Drainage',
    description:
      'Silted storm gutter overflowing during heavy rainfall causing stagnant water pools across the primary pedestrian walkway and commercial frontage.',
    state: 'Akwa Ibom State',
    lga: 'Uyo LGA',
    ward: 'Ewet Housing Estate',
    address: 'Abak Road by Tropicana Junction',
    landmark: 'Near Ewet Housing Gate',
    lat: '5.0195° N',
    lng: '7.9314° E',
    status: 'in_progress',
    severity: 'moderate',
    reportedAt: '2h 10m ago',
    slaRemainingHours: 6,
    slaLabel: '06h : 45m',
    confirmations: 58,
    reporterName: 'Aniebiet Bassey',
    reporterVerified: true,
    assignedUnit: 'Akwa Ibom Drainage Unit #12',
    assignedDepot: 'Uyo Works Yard',
    squadLead: 'Engr. Ubong Akpan',
    beforePhotoUrl: HOTLINKED_IMAGES.drainageAuditStage1,
    progressPhotoUrl: HOTLINKED_IMAGES.drainageCanalCrew,
    exifVerified: true,
    distanceKm: 3.1,
    comments: [
      {
        id: 'c-3',
        author: 'AKSEPB Drainage Enforcement',
        role: 'Municipal Dispatch',
        isOfficial: true,
        timestamp: 'Today 09:30 AM',
        text: 'Vacuum desilting truck and 8-person sanitation crew mobilized along Abak Road.',
      },
    ],
  },
  {
    id: 'inc-3',
    refCode: 'STF-2026-004887',
    title: 'Collapsed Storm Drain Grating & Open Culvert',
    category: 'Blocked Drainage',
    description:
      'Broken cast-iron storm grate creating deep open drop-off along primary commuter corridor heading toward Eket Marina.',
    state: 'Akwa Ibom State',
    lga: 'Eket LGA',
    ward: 'Urban I Ward',
    address: 'Eket-Oron Road, Grace Bill Intersection',
    landmark: 'Opposite Eket Main Park',
    lat: '4.6423° N',
    lng: '7.9244° E',
    status: 'assigned',
    severity: 'critical',
    reportedAt: '3h ago',
    slaRemainingHours: 32,
    slaLabel: '32h : 00m',
    confirmations: 42,
    reporterName: 'Imaobong Essien',
    reporterVerified: true,
    assignedUnit: 'AKRMA Rapid Unit 02',
    assignedDepot: 'Eket Zonal Depot',
    squadLead: 'Engr. Edidiong Obot',
    beforePhotoUrl: HOTLINKED_IMAGES.yabaRoadWork,
    exifVerified: true,
    distanceKm: 2.2,
    comments: [],
  },
  {
    id: 'inc-4',
    refCode: 'STF-2026-004875',
    title: 'Damaged Median Guardrail & Signal Mast Fault',
    category: 'Traffic Signal Defect',
    description:
      'Non-functional traffic signal timing controller and impact-damaged median guardrail opposite General Hospital axis.',
    state: 'Akwa Ibom State',
    lga: 'Ikot Ekpene LGA',
    ward: 'Ikot Ekpene Urban',
    address: 'Aba Road by Four-Towns Junction',
    landmark: 'Near Raffia City Plaza',
    lat: '5.1778° N',
    lng: '7.7145° E',
    status: 'pending',
    severity: 'critical',
    reportedAt: '1h 15m ago',
    slaRemainingHours: 8,
    slaLabel: '08h : 00m',
    confirmations: 19,
    reporterName: 'Mfoniso Udo',
    reporterVerified: true,
    assignedUnit: 'Unassigned',
    assignedDepot: 'Raffia City Traffic Ops',
    squadLead: 'Pending Dispatch',
    beforePhotoUrl: HOTLINKED_IMAGES.potholeCloseup,
    exifVerified: true,
    distanceKm: 2.8,
    comments: [],
  },
  {
    id: 'inc-5',
    refCode: 'STF-2026-004871',
    title: 'Illegal Waste Overflow & Median Refuse Dump',
    category: 'Waste Heap / Sanitation',
    description:
      'Commercial refuse accumulation spilling onto arterial lane near Oron Beach Market corridor.',
    state: 'Akwa Ibom State',
    lga: 'Oron LGA',
    ward: 'Oron Urban I',
    address: 'Mary Hanney Road Arterial',
    landmark: 'Near Oron Beach Terminal',
    lat: '4.8224° N',
    lng: '8.2341° E',
    status: 'under_review',
    severity: 'moderate',
    reportedAt: '3h 40m ago',
    slaRemainingHours: 4,
    slaLabel: '04h : 15m',
    confirmations: 26,
    reporterName: 'Edet Okon',
    reporterVerified: true,
    assignedUnit: 'AKSEPB Compactor Truck #22',
    assignedDepot: 'Oron Sanitation Yard',
    squadLead: 'Sup. S. Etuk',
    beforePhotoUrl: HOTLINKED_IMAGES.drainageCrew,
    exifVerified: true,
    distanceKm: 4.5,
    comments: [],
  },
  {
    id: 'inc-6',
    refCode: 'STF-2026-004860',
    title: 'Streetlight Outage & Road Striping Restoration',
    category: 'Streetlight Failure',
    description:
      '4x solar LED streetlights restored and fresh thermo-plastic reflective lane striping completed across 4 traffic lanes.',
    state: 'Akwa Ibom State',
    lga: 'Uyo LGA',
    ward: 'Shelter Afrique',
    address: 'Nwaniba Road Expressway',
    landmark: 'Opposite Shelter Afrique Estate',
    lat: '5.0156° N',
    lng: '7.9598° E',
    status: 'fixed',
    severity: 'low',
    reportedAt: 'Yesterday',
    slaRemainingHours: 0,
    slaLabel: 'Completed',
    confirmations: 81,
    reporterName: 'Idara Umana',
    reporterVerified: true,
    assignedUnit: 'Ibom Power Streetlight Unit',
    assignedDepot: 'Uyo Electrical Depot',
    squadLead: 'Engr. F. Inyang',
    beforePhotoUrl: HOTLINKED_IMAGES.finishedRoadStriping,
    afterPhotoUrl: HOTLINKED_IMAGES.finishedRoadStriping,
    exifVerified: true,
    distanceKm: 7.4,
    comments: [
      {
        id: 'c-4',
        author: 'AKRMA Quality Audit Inspector',
        role: 'Quality Assurance',
        isOfficial: true,
        timestamp: 'Yesterday 05:20 PM',
        text: 'Post-restoration luminance and striping audit passed 100%. Case closed.',
      },
    ],
  },
  {
    id: 'inc-7',
    refCode: 'STF-2026-004845',
    title: 'Streetlight Outage Along Shehu Shagari Way',
    category: 'Streetlight Failure',
    description:
      'Six feeder streetlights dark along ministerial boulevard; restored and certified operational.',
    state: 'FCT Abuja',
    lga: 'AMAC Municipal',
    ward: 'Central Business District',
    address: 'Shehu Shagari Way',
    landmark: 'Near Federal Secretariat',
    lat: '9.0643° N',
    lng: '7.4982° E',
    status: 'fixed',
    severity: 'moderate',
    reportedAt: '2 days ago',
    slaRemainingHours: 0,
    slaLabel: 'Certified',
    confirmations: 45,
    reporterName: 'Ibrahim M.',
    reporterVerified: true,
    assignedUnit: 'FCDA Electrical Maintenance',
    assignedDepot: 'AMAC Central Yard',
    squadLead: 'Engr. Musa Danjuma',
    beforePhotoUrl: HOTLINKED_IMAGES.asphaltCrewHero,
    afterPhotoUrl: HOTLINKED_IMAGES.finishedRoadStriping,
    exifVerified: true,
    distanceKm: 1.9,
    comments: [],
  },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'st-hq',
    initials: 'SF',
    name: 'Office of StreetFix (HQ)',
    serviceId: '#STF-HQ-0001',
    title: 'Website Backend Authority',
    department: 'StreetFix Head Office (Backend)',
    roleLevel: 'SUPER ADMIN',
    lgaJurisdiction: 'Nationwide (36 States + FCT)',
    mfaMethod: 'Hardware Root Key',
    lastTelemetry: 'Online Now',
    lastAction: 'Root Backend Governance Active',
    status: 'Active',
    email: 'office@streetfix.ng',
    phone: '+234 1 227 0000',
    passcode: 'OfficeBackend#2026',
    isStreetFixOffice: true,
  },
  {
    id: 'st-1',
    initials: 'IE',
    avatarUrl: engrIniobongEkpoPhoto,
    name: 'Engr. Iniobong Ekpo',
    serviceId: '#AKSG-WRK-4091',
    title: 'Squad 4 Lead',
    department: 'Akwa Ibom Roads (AKRMA)',
    roleLevel: 'FIELD SQUAD LEAD',
    lgaJurisdiction: 'Uyo & Itu',
    mfaMethod: '2FA Active',
    lastTelemetry: '5 mins ago',
    lastAction: 'Dispatched STF-2026-004892',
    status: 'Active',
    email: 'iniobong.ekpo@akrma.ak.gov.ng',
    phone: '+234 803 412 8890',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
  {
    id: 'st-2',
    initials: 'EU',
    avatarUrl: ekeminiUdoPhoto,
    name: 'Ekemini Udo',
    serviceId: '#AKSG-TRG-1024',
    title: 'Central Intake',
    department: 'Civic Operations Command',
    roleLevel: 'TRIAGE OFFICER',
    lgaJurisdiction: 'Statewide Central (31 LGAs)',
    mfaMethod: 'Hardware Key',
    lastTelemetry: '12 mins ago',
    lastAction: 'Triaged 14 Potholes',
    status: 'Active',
    email: 'ekemini.udo@streetfix.ng',
    phone: '+234 806 552 1904',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
  {
    id: 'st-3',
    initials: 'OB',
    avatarUrl: drUbongBasseyPhoto,
    name: 'Dr. Ubong Bassey',
    serviceId: '#AKSG-DIR-0012',
    title: 'Bureau Chief',
    department: 'AKSEPB Waste & Drainage',
    roleLevel: 'AGENCY DIRECTOR',
    lgaJurisdiction: 'Statewide (Sanitation)',
    mfaMethod: '2FA Active',
    lastTelemetry: '2 hours ago',
    lastAction: 'Approved Drainage Batch',
    status: 'Active',
    email: 'ubong.bassey@aksepb.ak.gov.ng',
    phone: '+234 802 918 3341',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
  {
    id: 'st-4',
    initials: 'AB',
    name: 'Aisha Bello',
    serviceId: '#AKSG-SEC-8821',
    title: 'Security Officer',
    department: 'Govt Cyber Operations Hub',
    roleLevel: 'SUPER ADMIN',
    lgaJurisdiction: 'All 31 LGAs (Root)',
    mfaMethod: 'YubiKey Enforced',
    lastTelemetry: 'Online Now',
    lastAction: 'IP: 102.89.44.12 (Uyo Hub)',
    status: 'Active',
    email: 'aisha.bello@aksg.gov.ng',
    phone: '+234 809 771 4400',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
  {
    id: 'st-5',
    initials: 'IA',
    name: 'Itoro Akpan',
    serviceId: '#AKSG-FLD-2241',
    title: 'Paving Specialist',
    department: 'Akwa Ibom Roads (AKRMA)',
    roleLevel: 'FIELD TECHNICIAN',
    lgaJurisdiction: 'Eket & Ikot Ekpene',
    mfaMethod: 'SMS OTP',
    lastTelemetry: '41 mins ago',
    lastAction: 'Logged Material Receipt',
    status: 'Active',
    email: 'itoro.akpan@akrma.ak.gov.ng',
    phone: '+234 805 339 7712',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
];

export const DEPARTMENT_QUOTAS: DepartmentQuota[] = [
  {
    id: 'dq-1',
    name: 'Akwa Ibom Roads (AKRMA)',
    shortCode: 'AKRMA',
    slaRate: '96.2% SLA',
    slaStatus: 'healthy',
    activeSquads: 18,
    staffCount: 142,
    utilizationPct: 88,
    barColor: '#132E20',
  },
  {
    id: 'dq-2',
    name: 'AKSEPB Waste & Drainage',
    shortCode: 'AKSEPB',
    slaRate: '94.9% SLA',
    slaStatus: 'healthy',
    activeSquads: 12,
    staffCount: 94,
    utilizationPct: 76,
    barColor: '#7E22CE',
  },
  {
    id: 'dq-3',
    name: 'Akwa Ibom Water Co. (AKSWC)',
    shortCode: 'AKSWC',
    slaRate: '89.4% SLA',
    slaStatus: 'warning',
    activeSquads: 6,
    staffCount: 48,
    utilizationPct: 62,
    barColor: '#E06236',
  },
  {
    id: 'dq-4',
    name: 'Ibom Power & Lighting',
    shortCode: 'IPOWER',
    slaRate: '97.8% SLA',
    slaStatus: 'healthy',
    activeSquads: 6,
    staffCount: 28,
    utilizationPct: 95,
    barColor: '#059669',
  },
];
