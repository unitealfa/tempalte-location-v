const defaultContent = {
  brand: {
    name: "Lea Location",
    logoText: "LEA",
    browserTitle: "Lea Location"
  },
  header: {
    accountLabel: "Mon compte",
    loginLabel: "Se connecter",
    connectedLabel: "Connecte",
    closeButtonLabel: "Fermer la fenetre",
    profileLabel: "Profile",
    logoutLabel: "Se deconnecter",
    dashboardLabel: "Dashboard",
    clientsLabel: "Reservations",
    visualLabel: "Visuelle",
    navigationItems: [
      {
        label: "ACCUEIL",
        path: "/"
      },
      {
        label: "LOCATION DE VOITURES",
        path: "/location-de-voitures"
      },
      {
        label: "Foire aux questions",
        path: "/foire-aux-questions"
      },
      {
        label: "CONTACT",
        path: "/contact"
      }
    ]
  },
  aceulle: {
    eyebrow: "EXCLUSIVITÉ RENTZO",
    title: "LOCATION DE VOITURES DE LUXE À ALGER",
    description:
      "Une page d'accueil premium inspiree du rendu Rentzo, avec vos vraies voitures, une navigation legere et un chargement optimise.",
    primaryActionLabel: "Voir les vehicules",
    secondaryActionLabel: "Nous contacter",
    introEyebrow: "ACCUEIL",
    introTitle:
      "Des vehicules reels, visibles rapidement, avec une presentation haut de gamme.",
    introDescription:
      "Retrouvez vos voitures disponibles avec un rendu premium, des informations claires et une navigation adaptee meme aux connexions lentes.",
    highlights: [
      "Catalogue rapide a charger",
      "Reservation simple depuis chaque vehicule",
      "Remise bureau ou aeroport"
    ],
    fleetEyebrow: "LOCATION DE VOITURES",
    fleetTitle: "Notre flotte de voitures de luxe à Alger",
    fleetDescription:
      "Decouvrez les vehicules actuellement visibles sur le site avec leur image principale, leur nom et leur prix journalier.",
    fleetLoadingLabel: "Chargement des vehicules...",
    fleetEmptyTitle: "Aucun vehicule disponible",
    fleetEmptyDescription:
      "Le catalogue public est vide pour le moment. Revenez plus tard pour voir les prochaines disponibilites.",
    fleetActionLabel: "Voir tout le catalogue",
    convertiblesTitle: "Découvrez nos cabriolets à louer !",
    convertiblesEmptyTitle: "Aucun cabriolet disponible",
    convertiblesEmptyDescription:
      "Aucun véhicule cabriolet n'est visible pour le moment. Revenez plus tard pour découvrir les prochaines disponibilités.",
    carHotelTitle: "HÔTEL DE VOITURES",
    carHotelDescription:
      "Chez RENTZO EXCLUSIVE, nous proposons un hébergement et des soins spécialisés pour votre véhicule, notamment pour les véhicules de luxe ou haut de gamme.",
    carHotelServicesTitle: "NOS SERVICES",
    carHotelServices: [
      "Sécurité et surveillance 24h/24",
      "Votre véhicule de luxe sera propre",
      "Nous maintenons le niveau de pression des pneus correct.",
      "État optimal de la batterie de la voiture en permanence"
    ],
    testimonialsTitle: "L'avis de nos clients",
    testimonialsHighlight: "La satisfaction",
    testimonialsTextLine1: "de nos clients",
    testimonialsTextLine2: "nous aide à nous améliorer constamment.",
    testimonialsItems: [
      {
        text:
          "Une expérience de luxe du début à la fin. J'ai loué une voiture sportive avec eux et tout a dépassé mes attentes. L'accueil a été excellent et très professionnel.",
        name: "Ana Costas Viñarás",
        title: "Client"
      },
      {
        text:
          "Service spectaculaire. Nous avons loué une Mercedes pendant une semaine et je n'ai que de bons mots pour l'équipe. Nous reviendrons.",
        name: "Javier Sánchez - Brunete",
        title: "Client"
      },
      {
        text: "Service excellent, traitement imbattable",
        name: "Estefanía Jimenez López",
        title: "Client"
      },
      {
        text: "Les meilleures voitures exclusives à louer en ville.",
        name: "Adelina Elena",
        title: "Client"
      },
      {
        text:
          "Service irréprochable, 100 %. Je ne peux pas mettre plus, mais pour moi c'est la meilleure adresse pour les voitures exclusives.",
        name: "Sonia Valero",
        title: "Client"
      }
    ]
  },
  adminLogin: {
    eyebrow: "Espace admin",
    title: "Connectez-vous à votre compte",
    description: "Bienvenue ! Connectez-vous à votre compte.",
    loginLabel: "Adresse e-mail ou nom d'utilisateur",
    loginPlaceholder: "Adresse e-mail ou nom d'utilisateur",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Mot de passe",
    rememberLabel: "Souviens-toi",
    forgotPasswordLabel: "Mot de passe oublié ?",
    forgotPasswordUrl:
      "mailto:lea@gmail.com?subject=Mot%20de%20passe%20oubli%C3%A9",
    supportEmail: "lea@gmail.com",
    submitLabel: "Accéder",
    backLabel: "Retour a l'accueil",
    successMessage: "Connexion admin reussie.",
    errorMessage: "Identifiants invalides."
  },
  adminAceulle: {
    eyebrow: "Tableau de bord",
    titlePrefix: "Bienvenue",
    description:
      "Gardez une vue directe sur les demandes a traiter, les reservations confirmees, les clients uniques et les tendances de location.",
    loadingLabel: "Chargement du dashboard...",
    errorMessage: "Impossible de charger le dashboard.",
    summaryPendingLabel: "Demandes a traiter",
    summaryPendingHelper: "demandes clients encore en attente",
    summaryAcceptedLabel: "Reservations confirmees",
    summaryAcceptedHelper: "reservations acceptees en cours ou a venir",
    summaryVisibleLabel: "Visibles ce mois",
    summaryVisibleHelper: "reservations visibles sur le mois courant",
    summaryVisitsLabel: "Demandes clients",
    summaryVisitsHelper: "formulaires recus sur la periode",
    summaryVisitorsLabel: "Clients uniques",
    summaryVisitorsHelper: "contacts differents identifies",
    summaryVisitsFilterLabel: "Synthese",
    summaryVisitsFilterDayLabel: "Jour",
    summaryVisitsFilterWeekLabel: "Semaine",
    summaryVisitsFilterMonthLabel: "Mois",
    thisMonthLabel: "Ce mois",
    fleetCountLabel: "Vehicules suivis",
    insightTopVehicleTitle: "Vehicule le plus loue",
    insightBusiestMonthTitle: "Periode la plus chargee",
    insightBusiestWeekdayTitle: "Jour le plus demande",
    chartReservationsByMonthTitle: "Locations confirmees par mois",
    chartTopVehiclesTitle: "Top vehicules loues",
    chartReservationsByWeekdayTitle: "Depart des locations par jour",
    chartSiteVisitsTitle: "Demandes clients sur 7 jours",
    chartFleetStatusTitle: "Etat actuel de la flotte",
    chartRevenueTitle: "Revenus sur la periode",
    filterViewLabel: "Vue",
    filterMonthLabel: "Mois",
    filterYearLabel: "Annee",
    filterViewMonthLabel: "Mois",
    filterViewYearLabel: "Annee",
    filterViewAllLabel: "Tout",
    summaryRevenueLabel: "Revenus",
    summaryRevenueHelper: "montant des reservations confirmees sur la periode",
    summaryRangeLabel: "Periode analysee",
    summaryRangeHelper: "vision synthese du filtre actif",
    lineReservationsTitle: "Evolution des reservations",
    lineVisitsTitle: "Evolution des demandes",
    barsTopVehiclesTitle: "Vehicules les plus reserves",
    barsWeekdayTitle: "Reservations par jour",
    emptyChartLabel: "Pas encore assez de donnees pour afficher ce graphique."
  },
  adminProfile: {
    eyebrow: "Profile admin",
    title: "Modifier le profile",
    description:
      "Vous pouvez modifier le nom d'utilisateur, l'email et le mot de passe depuis cette page securisee.",
    profileSectionTitle: "Modifier les informations",
    profileUsernameLabel: "Nom d'utilisateur",
    profileEmailLabel: "Email",
    profileSubmitLabel: "Enregistrer le profile",
    profileSubmitPendingLabel: "Enregistrement en cours...",
    passwordSectionTitle: "Modifier le mot de passe",
    passwordSectionDescription:
      "Selectionnez seulement le mot de passe actuelle et le nouveau mot de passe pour recevoir un code de verification.",
    currentPasswordLabel: "Mot de passe actuelle",
    currentPasswordPlaceholder: "Entrez le mot de passe actuelle",
    newPasswordLabel: "Nouveau mot de passe",
    newPasswordPlaceholder: "Entrez le nouveau mot de passe",
    passwordSubmitLabel: "Modifier le mot de passe",
    passwordSubmitPendingLabel: "Modification en cours...",
    verificationTitle: "Modifier le mot de passe",
    verificationDescriptionPrefix: "Entrez le code envoye a",
    verificationCodeLabel: "Code de verification",
    verificationCodePlaceholder: "000000",
    verificationConfirmLabel: "Confirmer",
    verificationConfirmPendingLabel: "Confirmation en cours...",
    verificationResendLabel: "Renvoyer",
    verificationResendPendingLabel: "Renvoi en cours...",
    verificationCancelLabel: "Annuler",
    verificationCancelPendingLabel: "Operation en cours...",
    verificationExpiredLabel: "Le code a expire. Vous pouvez le renvoyer.",
    backLabel: "Retour au tableau de bord"
  },
  publicPages: {
    commencer: {
      title: "Commencer"
    },
    locationDeVoitures: {
      title: "LOCATION DE VOITURES"
    },
    contact: {
      title: "CONTACT"
    },
    foireAuxQuestions: {
      title: "Foire aux questions"
    }
  },
  faqPage: {
    heroTitleStart: "Questions fréquentes",
    heroTitleAccent: "",
    heroSubtitle: "Nous répondrons à toutes vos questions",
    pageTitle: "Foire aux questions",
    contactButtonLabel: "Contact",
    leftItems: [
      {
        question: "Quels documents dois-je fournir pour louer un véhicule haut de gamme ?",
        answer: "Une carte d'identité ou un passeport, un permis de conduire en cours de validité, ainsi qu'une carte de crédit pour la caution."
      },
      {
        question: "Quels types de véhicules proposez-vous ?",
        answer: "Citadines, compactes, SUV, sportives et véhicules haut de gamme."
      },
      {
        question: "Quel est l'âge minimum pour louer une voiture exclusive ?",
        answer: "25 ans minimum et au moins 4 ans d'expérience de conduite."
      },
      {
        question: "L'assurance est-elle incluse dans la location ?",
        answer: "Oui, tous les véhicules incluent une assurance tous risques avec franchise."
      },
      {
        question: "Puis-je demander la livraison et la récupération du véhicule ?",
        answer: "Oui, nous proposons la livraison et la reprise du véhicule dans toute la province."
      },
      {
        question: "Les conducteurs supplémentaires sont-ils autorisés ?",
        answer: "Oui, avec un coût supplémentaire. Consultez les conditions."
      }
    ],
    rightItems: [
      {
        question: "Comment réserver une voiture exclusive ?",
        answer: "Via le formulaire web, WhatsApp ou par e-mail."
      },
      {
        question: "Que se passe-t-il si je dois annuler ou modifier ma réservation ?",
        answer: "Cela entraîne un coût supplémentaire."
      },
      {
        question: "Puis-je louer une voiture pour seulement quelques heures ?",
        answer: "La durée minimale de location est d'une journée."
      },
      {
        question: "Avez-vous une assistance client 24h/24 et 7j/7 ?",
        answer: "Oui, via WhatsApp."
      },
      {
        question: "Puis-je restituer la voiture en dehors des horaires de bureau ?",
        answer: "Oui, avec un coût supplémentaire de 15 €."
      },
      {
        question: "Proposez-vous des extras comme chauffeur, champagne ou services spéciaux ?",
        answer: "Oui, nous disposons de notre propre flotte VTC pour proposer un service entièrement personnalisé."
      }
    ]
  },
  contactPage: {
    heroTitleStart: "Contactez",
    heroTitleAccent: "nous",
    heroSubtitle: "Contactez-nous pour la location de voitures",
    pageTitle: "Contact",
    shortInfo: "✔︎ Lea Location.\nLocation de voitures de luxe à ALGER.",
    socialTitle: "Suivez-nous",
    mapQuery: "Alger Centre, Alger, Algeria",
    formNamePlaceholder: "Nom",
    formEmailPlaceholder: "Adresse e-mail*",
    formPhonePlaceholder: "Telephone",
    formMessagePlaceholder: "Message*",
    formPrivacyLabel: "J'accepte la politique de confidentialite",
    formSubmitLabel: "Envoyer",
    formNotice:
      "Le formulaire de contact sera raccorde au back ensuite. Utilisez le telephone ou l'email pour une reponse immediate.",
    hoursTitle: "Horaires",
    hoursSubtitle: "Contactez-nous et nous vous reserverons un rendez-vous",
    hoursItems: [
      { day: "Lundi", value: "10:00 - 18:00" },
      { day: "Mardi", value: "10:00 - 18:00" },
      { day: "Mercredi", value: "10:00 - 18:00" },
      { day: "Jeudi", value: "10:00 - 18:00" },
      { day: "Vendredi", value: "10:00 - 18:00" },
      { day: "Samedi", value: "Ferme" },
      { day: "Dimanche", value: "Ferme" }
    ]
  },
  vehicles: {
    eyebrow: "Catalogue",
    title: "LOCATION DE VOITURES",
    emptyTitle: "Aucun vehicule disponible",
    listDescription:
      "Retrouvez les vehicules disponibles avec leurs informations essentielles et leurs tarifs.",
    emptyDescription:
      "Aucun vehicule n'est visible pour le moment. Revenez plus tard pour voir les prochaines disponibilites.",
    adminDescription:
      "Depuis cette page, l'admin peut creer, modifier, masquer et supprimer les vehicules.",
    heroTitleStart: "Location de voitures de luxe",
    heroTitleAccent: "a Alger",
    heroSubtitle:
      "Louez un vehicule le temps qu'il vous faut : a la journee, a la semaine ou au mois",
    mobileFiltersLabel: "RECHERCHE (Choisir les filtres)",
    mobileFiltersTitle: "RECHERCHE (Choisir les filtres)",
    mobileSearchLabel: "Rechercher",
    clearFiltersLabel: "Effacer les filtres",
    filterVehicleRangeLabel: "Gamme",
    filterBrandLabel: "Marque",
    filterModelLabel: "Modele",
    filterTransmissionLabel: "Boite de vitesse",
    filterFuelTypeLabel: "Carburant",
    filterSeatsLabel: "Places",
    filterConvertibleLabel: "Cabriolet",
    filterAvailabilityLabel: "Disponibilite",
    filterAnyOptionLabel: "Tous",
    filterConvertibleYesLabel: "Oui",
    filterConvertibleNoLabel: "Non",
    filterKeywordPlaceholder: "Rechercher un vehicule",
    resultsSingularLabel: "Vehicule",
    resultsPluralLabel: "Vehicules",
    sortHeadingLabel: "Trier par :",
    sortNewestLabel: "Derniers vehicules",
    sortPriceLowLabel: "Prix le plus bas",
    sortPriceHighLabel: "Prix le plus eleve",
    sortNameLabel: "Trier par marque",
    viewGridLabel: "Vue grille",
    viewListLabel: "Vue liste",
    cardDailyPriceLabel: "Prix journalier :",
    cardPhotosLabel: "photos",
    reserveFormLabel: "Reserver via le formulaire",
    reserveWhatsappLabel: "Discutez via WhatsApp",
    whatsappNumber: "0779107446",
    whatsappInternationalNumber: "213779107446",
    reservationSectionEyebrow: "Reservation",
    reservationSectionTitle: "Envoyer une demande de reservation",
    reservationSectionDescription:
      "Completez ce formulaire pour envoyer votre demande. Notre equipe vous recontactera rapidement.",
    reservationAvailabilityTitle: "Disponibilites du vehicule",
    reservationAvailabilityDescription:
      "Les dates grisées sont déjà réservées et ne peuvent pas être sélectionnées.",
    reservationAvailabilityLoadingLabel:
      "Chargement des disponibilites en cours...",
    reservationPickupDateLabel: "Lieux de récupération",
    reservationPickupTimeLabel: "Heure de récupération",
    reservationReturnDateLabel: "Lieux de retour",
    reservationReturnTimeLabel: "Heure de retour",
    reservationSelectPickupFirstLabel:
      "Sélectionnez d'abord un Lieux de récupération.",
    reservationNoAvailabilityLabel:
      "Aucune date disponible sur cette période.",
    reservationMonthPreviousLabel: "Mois précédent",
    reservationMonthNextLabel: "Mois suivant",
    reservationAvailableLegendLabel: "Disponible",
    reservationReservedLegendLabel: "Déjà réservé",
    reservationUnavailableLegendLabel: "Indisponible",
    reservationSelectedLegendLabel: "Sélectionné",
    reservationAvailabilitySelectVehicleLabel:
      "Sélectionnez un véhicule pour afficher son calendrier de réservation.",
    reservationSuccessMessage:
      "Merci, votre réservation a bien été envoyée.",
    reservationSuccessDetailMessage:
      "Notre équipe vérifie votre demande et vous recontactera rapidement par téléphone, e-mail ou WhatsApp.",
    reservationErrorMessage: "La réservation n'a pas pu être envoyée.",
    reservationScheduleTitle: "FORMULAIRE DE RÉSERVATION",
    reservationPickupGroupLabel: "• À RÉCUPÉRER À",
    reservationReturnGroupLabel: "• RETOURNER À",
    reservationCustomerGroupLabel: "DONNÉES CLIENTS",
    reservationLicenseGroupLabel: "PERMIS DE CONDUIRE",
    reservationCommentGroupLabel: "OBSERVATIONS",
    reservationFirstNameLabel: "Prénom",
    reservationLastNameLabel: "Nom",
    reservationDrivingLicenseLabel: "Photo du permis de conduire*",
    reservationEmailLabel: "E-mail",
    reservationPhoneLabel: "Téléphone",
    reservationCommentLabel: "Commentaire",
    reservationFirstNamePlaceholder: "Prénom*",
    reservationLastNamePlaceholder: "Nom*",
    reservationFullNamePlaceholder: "Nom et prénom*",
    reservationBirthDatePlaceholder: "Date de naissance*",
    reservationDrivingLicensePlaceholder: "Ajoutez la photo du permis de conduire*",
    reservationDrivingLicenseEmptyLabel: "Aucun fichier choisi",
    reservationDrivingLicenseRequiredMessage:
      "Ajoutez obligatoirement la photo du permis de conduire.",
    reservationDrivingLicenseInvalidMessage:
      "Format non accepte. Utilisez JPG, JPEG, PNG, WEBP, GIF, BMP, SVG, AVIF, HEIC, HEIF ou JFIF.",
    reservationEmailPlaceholder: "E-mail (optionnel)",
    reservationPhonePlaceholder: "Téléphone*",
    reservationCommentPlaceholder: "Écrivez votre message",
    reservationPickupLocationLabel: "À récupérer à",
    reservationReturnLocationLabel: "Retourner à",
    reservationPickupDatetimeLabel: "Lieux de récupération",
    reservationReturnDatetimeLabel: "Date de retour",
    reservationSubmitLabel: "Envoyer",
    reservationPrivacyLabel:
      "J'accepte la politique de confidentialité.",
    reservationPricingTitle: "Prix de la location",
    reservationAppliedRateLabel: "Tarif applique",
    reservationBilledDaysLabel: "Jours factures",
    reservationEstimatedTotalLabel: "Prix total",
    reservationPricePendingLabel: "Selectionnez vos dates pour afficher le prix.",
    reservationAdminTotalPriceLabel: "Prix total de la location",
    reservationAdminPriceHelpLabel:
      "Le montant se calcule automatiquement selon la duree, mais l'administration peut le modifier.",
    reservationAdminRecalculatePriceLabel: "Recalculer automatiquement",
    reservationRateTypeLabel: "Base tarifaire",
    reservationPriceModeLabel: "Mode de prix",
    reservationPriceModeAutomaticLabel: "Calcul automatique",
    reservationPriceModeManualLabel: "Modifie manuellement",
    reservationPickupLocationOptions: [
      { value: "bureau", label: "Bureau" },
      { value: "aeroport", label: "Aeroport" },
      {
        value: "commentaire",
        label: "Preciser dans les commentaires"
      }
    ],
    createLabel: "+ Ajouter un vehicule",
    createTitle: "Creer un vehicule",
    editTitle: "Modifier le vehicule",
    createDescription:
      "Ajoutez un vehicule avec toutes les informations necessaires pour l'afficher dans le catalogue.",
    editDescription:
      "Mettez a jour les informations du vehicule et sa disponibilite.",
    globalPricingTitle: "Description du prix",
    globalPricingDescription:
      "* Les prix affiches sont indicatifs et peuvent varier selon la periode de l'annee. Notre equipe vous confirmera le prix final par e-mail, telephone ou WhatsApp lors de votre demande de reservation.",
    globalConditionsTitle: "Conditions de location",
    globalConditionsDescription:
      "Les conditions de location s'appliquent a l'ensemble du catalogue et vous seront confirmees lors de votre demande de reservation.",
    createSubmitLabel: "Creer le vehicule",
    editSubmitLabel: "Enregistrer les modifications",
    createSubmittingLabel: "Creation en cours...",
    editSubmittingLabel: "Modification en cours...",
    backToListLabel: "Retour a la liste",
    backToVehicleLabel: "Retour au vehicule",
    loadErrorMessage: "Impossible de charger les vehicules.",
    detailErrorMessage: "Impossible de charger ce vehicule.",
    createErrorMessage: "Creation du vehicule impossible.",
    updateErrorMessage: "Modification du vehicule impossible.",
    deleteErrorMessage: "Suppression du vehicule impossible.",
    maintenanceErrorMessage: "Passage en maintenance impossible.",
    availableErrorMessage: "Remise du vehicule en disponibilite impossible.",
    notFoundMessage: "Ce vehicule est introuvable.",
    deleteConfirmMessage: "Voulez-vous supprimer ce vehicule ?",
    maintenanceConfirmMessage:
      "Voulez-vous masquer ce vehicule pour les visiteurs et le passer en maintenance ?",
    detailActionLabel: "Voir les details",
    pricePerDaySuffix: "/jour",
    seatsSuffix: "places",
    maintenanceBadge: "Maintenance",
    maintenanceDescription:
      "Ce véhicule est actuellement masqué pour les visiteurs et visible uniquement par l'administration.",
    adminReserveLabel: "Reserver",
    adminEditLabel: "Modifier",
    adminDeleteLabel: "Supprimer",
    adminMaintenanceLabel: "Mettre en maintenance",
    adminMaintenanceDoneLabel: "Retirer de maintenance",
    adminAvailabilityLabel: "Disponibilité",
    availabilityAvailableLabel: "Disponible",
    availabilityReservedLabel: "Réservé",
    availabilityMaintenanceLabel: "Maintenance",
    pricingSectionTitle: "Tarifs",
    informationSectionTitle: "Informations",
    photosSectionTitle: "Photos du véhicule",
    videoSectionTitle: "Vidéo du véhicule",
    noVideoLabel: "Aucune vidéo ajoutée.",
    brandLabel: "Marque",
    modelLabel: "Modèle",
    versionLabel: "Version",
    fuelTypeLabel: "Carburant",
    transmissionLabel: "Boîte de vitesse",
    transmissionDetailLabel: "Changement",
    seatsDetailLabel: "Lieux",
    detailSecurityDepositHeading: "DÉPÔT DE GARANTIE",
    detailSecurityDepositPrefix: "À partir de",
    detailAllowedMileageHeading: "KILOMÉTRAGE AUTORISÉ",
    detailAllowedMileagePerDayPrefix: "Par jour :",
    detailAllowedMileageExtraPrefix: "Kilomètres supplémentaires :",
    detailAllowedMileageExtraSuffix: "/km",
    fuelTypeOptions: ["Essence", "Diesel", "GPL"],
    transmissionOptions: ["Automatique", "Manuelle"],
    vehicleRangesLabel: "Gamme du vehicule",
    vehicleRangesHint:
      "Selectionnez 1 ou 2 gammes maximum pour ce vehicule.",
    vehicleRangesLimitMessage:
      "Vous pouvez selectionner au maximum 2 gammes du vehicule.",
    vehicleRangeOptions: [
      "Luxe",
      "SUV",
      "Citadines",
      "Berlines",
      "Sportives"
    ],
    compareToggleLabel: "Comparer",
    compareSelectOneMoreLabel: "Selectionnez-en un de plus",
    compareDrawerHint:
      "Vous y etes presque, selectionnez au moins un vehicule de plus pour comparer.",
    compareBackToSearchLabel: "Retour a la recherche",
    comparePageTitle: "Comparer",
    compareAddAnotherLabel: "Ajouter un autre vehicule",
    compareLockLabel: "Bloquer colonne",
    compareLockedLabel: "Bloque",
    compareViewLabel: "Voir",
    compareRemoveLabel: "Retirer ce vehicule de la comparaison",
    compareEmptyMessage:
      "Aucun vehicule n'a ete ajoute a la comparaison pour le moment.",
    compareLoadErrorMessage:
      "Impossible de charger les vehicules a comparer.",
    seatsLabel: "Nombre de places",
    convertibleLabel: "Cabriolet",
    horsepowerLabel: "Puissance (HP)",
    dailyPriceLabel: "Prix journalier",
    weeklyPriceLabel: "Prix hebdomadaire",
    monthlyPriceLabel: "Prix mensuel",
    securityDepositLabel: "Depot de garantie",
    includedKmPerDayLabel: "Kilometrage autorise par jour",
    extraKmPriceLabel: "Prix des kilometres supplementaires",
    videoUrlLabel: "Video du vehicule (facultative)",
    videoDropHint: "Cliquez ou deposez une video ici",
    mediaSelectLabel: "Selectionner",
    mediaSelectedVideoLabel: "Video prete a etre ajoutee",
    photoUrlsLabel: "Photos du vehicule",
    photoDropHint: "Cliquez ou deposez des photos ici",
    mediaSelectedPhotoSingularLabel: "photo selectionnee",
    mediaSelectedPhotoPluralLabel: "photos selectionnees",
    mediaDropActiveLabel: "Relachez pour ajouter le fichier",
    invalidVideoDropMessage:
      "Format non accepte. Utilisez MP4, WEBM, MOV, M4V, OGG ou OGV.",
    invalidPhotoDropMessage:
      "Format non accepte. Utilisez JPG, JPEG, PNG, WEBP, GIF, BMP, SVG, AVIF, HEIC, HEIF ou JFIF.",
    yesLabel: "Oui",
    noLabel: "Non",
    detailPriceTitle: "PRIX DE LOCATION",
    detailVehicleDataTitle: "DONNÉES DU VÉHICULE",
    detailVideoTitle: "VIDÉO DU VÉHICULE",
    detailConditionsTitle: "CONDITIONS DE LOCATION",
    detailReservationFormTitle: "FORMULAIRE DE RÉSERVATION",
    detailQualityTitle: "LOCATION DE QUALITÉ",
    detailQualityTextLine1: "Consultez nos services et",
    detailQualityTextHighlight: "notre FAQ",
    detailFaqButtonLabel: "Foire aux questions",
    detailAnimatedHeadlineStart: "Louez nos véhicules au meilleur prix",
    detailAnimatedHeadlineAccent: "hebdomadaire ou mensuel",
    detailRelatedTitle: "Véhicules apparentés",
    detailFeatureItems: [
      {
        icon: "edit",
        title: "assurance automobile",
        text: "Tous les véhicules sont assurés tous risques avec franchise."
      },
      {
        icon: "handshake",
        title: "Livraison et enlèvement",
        text: "Service de livraison et d'enlèvement dans toute la province de Malaga."
      }
    ]
  },
  reservations: {
    eyebrow: "Reservations",
    title: "Demandes de reservation",
    description:
      "Retrouvez ici toutes les demandes envoyees depuis le formulaire public.",
    emptyTitle: "Aucune reservation",
    emptyDescription:
      "Aucune demande n'a encore ete envoyee depuis le site.",
    detailTitle: "Detail de la reservation",
    detailDescription:
      "Cette page regroupe toutes les informations utiles pour traiter la demande.",
    durationLabel: "Duree",
    vehicleLabel: "Vehicule",
    customerLabel: "Client",
    pickupLabel: "Recuperation",
    returnLabel: "Retour",
    phoneLabel: "Telephone",
    emailLabel: "Email",
    emailOptionalLabel: "Email (optionnel)",
    commentLabel: "Commentaire",
    statusLabel: "Statut",
    statusPendingLabel: "En attente",
    statusAcceptedLabel: "Acceptee",
    licenseLabel: "Permis de conduire",
    createdAtLabel: "Envoyee le",
    acceptLabel: "Accepter",
    rejectLabel: "Refuser",
    acceptErrorMessage: "Impossible d'accepter cette reservation.",
    rejectErrorMessage: "Impossible de refuser cette reservation.",
    rejectConfirmMessage:
      "Voulez-vous refuser et supprimer cette demande de reservation ?",
    acceptedRedirectLabel: "Voir les reservations",
    createLabel: "+ Ajouter une reservation",
    editLabel: "Modifier la reservation",
    deleteLabel: "Supprimer la reservation",
    deleteConfirmMessage:
      "Voulez-vous supprimer cette reservation ?",
    createTitle: "Creer une reservation",
    createDescription:
      "Depuis cette page, l'admin peut enregistrer directement une reservation acceptee.",
    editTitle: "Modifier la reservation",
    editDescription:
      "Mettez a jour le vehicule, les dates et toutes les informations client de cette reservation.",
    saveCreateLabel: "Creer et accepter la reservation",
    saveEditLabel: "Enregistrer la reservation",
    formVehicleLabel: "Vehicule",
    formVehiclePlaceholder: "Selectionner un vehicule",
    formVehicleUnavailableSuffix: "indisponible sur cette periode",
    formVehicleConflictMessage:
      "Le vehicule selectionne est deja reserve sur cette periode.",
    formDurationLiveLabel: "Duree selectionnee",
    formDrivingLicenseReplaceLabel: "Remplacer le permis de conduire",
    formDrivingLicenseOptionalLabel: "Permis de conduire (optionnel)",
    formCurrentLicenseLabel: "Permis actuel",
    formDrivingLicenseInvalidMessage:
      "Format non accepte. Utilisez JPG, JPEG, PNG, WEBP, GIF, BMP, SVG, AVIF, HEIC, HEIF ou JFIF.",
    formSaveErrorMessage: "Impossible d'enregistrer cette reservation.",
    formDeleteErrorMessage: "Impossible de supprimer cette reservation.",
    formLoadErrorMessage: "Impossible de charger le formulaire de reservation.",
    backLabel: "Retour aux reservations",
    clientsTitle: "Reservations",
    clientsDescription:
      "Pilotez au meme endroit les demandes a traiter et les reservations deja confirmees, avec une lecture immediate du statut de chaque dossier.",
    clientsEmptyTitle: "Aucune reservation",
    clientsEmptyDescription:
      "Aucune demande ni reservation confirmee n'est disponible pour le moment.",
    clientsPendingEyebrow: "A traiter",
    clientsPendingTitle: "Demandes en attente",
    clientsPendingDescription:
      "Retrouvez ici les demandes envoyees par les clients et ouvrez chaque fiche pour accepter ou refuser rapidement.",
    clientsPendingEmptyTitle: "Aucune demande en attente",
    clientsPendingEmptyDescription:
      "Toutes les demandes recues ont deja ete traitees.",
    clientsPendingCountSuffix: "en attente",
    clientsPendingActionLabel: "Ouvrir la demande",
    clientsAcceptedEyebrow: "Confirmees",
    clientsAcceptedDescription:
      "Le calendrier affiche uniquement les reservations acceptees pour visualiser clairement l'occupation des vehicules.",
    clientsAcceptedEmptyTitle: "Aucune reservation acceptee",
    clientsAcceptedEmptyDescription:
      "Aucune reservation acceptee n'est en cours pour le moment.",
    clientsAcceptedCountSuffix: "reservations acceptees",
    clientsAcceptedSidebarDescription:
      "Liste rapide des reservations confirmees visibles sur la periode en cours.",
    clientsSummaryPendingLabel: "Demandes a traiter",
    clientsSummaryAcceptedLabel: "Reservations confirmees",
    clientsSummaryVisibleLabel: "Visibles ce mois",
    clientsMonthPreviousLabel: "Mois precedent",
    clientsMonthNextLabel: "Mois suivant",
    clientsSidebarTitle: "Reservations confirmees",
    clientsVisibleCountSuffix: "reservations visibles",
    calendarPickupLabel: "Depart",
    calendarReturnLabel: "Retour",
    detailCalendarTitle: "Calendrier de la reservation",
    licenseViewerTitle: "Visualisation du permis de conduire",
    closeViewerLabel: "Fermer le zoom",
    previousViewerLabel: "Image precedente",
    nextViewerLabel: "Image suivante",
    detailErrorMessage: "Impossible de charger cette reservation."
  },
  footer: {
    caption:
      "Location de voitures premium en Algerie avec un catalogue optimise pour un affichage rapide.",
    navigationTitle: "Navigation",
    contactTitle: "Contact",
    phoneCtaLabel: "Appelez-nous",
    phoneLabel: "Numero de tel",
    whatsappNumber: "213779107446",
    locationLabel: "Localisation",
    locationValue: "Alger",
    mapUrl: "https://maps.google.com/?q=Alger%2C+Algerie",
    brandLabel: "Nom",
    brandValue: "Lea Location",
    youtubeUrl: "#",
    copyrightText: "Copyright ©. Tous les droits reserves. unite.alpha",
    legalText: "Lea Location"
  }
};

module.exports = defaultContent;
