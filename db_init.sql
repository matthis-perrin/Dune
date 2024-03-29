BEGIN TRANSACTION;

INSERT INTO "colors" VALUES ('BLANC', 'BLANC', '#F6F6F6', '#000000', '#E74C3C', '1', '');
INSERT INTO "colors" VALUES ('ECRU', 'ECRU', '#F7D794', '#000000', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('ECRU ENDUIT', 'ECRU ENDUIT', '#F7D794', '#000000', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('E_11-700-300A', 'NOIR', '#3D3D3D', '#ffffff', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('E_11-950', 'BISTRE 477', '#856D4D', '#ffffff', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('E_11-951', 'VERT', '#2ECC71', '#000000', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('E_11952', 'BISTRE 483', '#856D4D', '#ffffff', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('E_12-021-077', 'BLANC CV', '#F6F6F6', '#000000', '#E74C3C', '1', '');
INSERT INTO "colors" VALUES ('E_12-072-787', 'ROUGE', '#E74C3C', '#000000', '#000000', '0', '');
INSERT INTO "colors" VALUES ('E_12029855', 'BLANC U', '#F6F6F6', '#000000', '#E74C3C', '1', '');
INSERT INTO "colors" VALUES ('E_16-998', 'BLEU', '#2E71CC', '#000000', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('E_771155-01', 'JAUNE', '#FFC700', '#000000', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('IVOIRE', 'IVOIRE', '#F7F1E3', '#000000', '#E74C3C', '1', '');
INSERT INTO "colors" VALUES ('JAUNE', 'JAUNE', '#FFC700', '#000000', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('MARRON', 'MARRON', '#784212', '#ffffff', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('NOIR', 'NOIR', '#3D3D3D', '#ffffff', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('OR', 'OR', '#EED807', '#000000', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('ORANGE', 'ORANGE', '#E67E22', '#000000', '#000000', '0', '');
INSERT INTO "colors" VALUES ('POLYPRO', 'POLYPRO', '#F0F0F0', '#000000', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('PRUNE', 'PRUNE', '#9B59B6', '#000000', '#E74C3C', '0', '');
INSERT INTO "colors" VALUES ('ROUGE', 'ROUGE', '#E74C3C', '#000000', '#000000', '0', '');
INSERT INTO "colors" VALUES ('VERT', 'VERT', '#2ECC71', '#000000', '#E74C3C', '0', '');

INSERT INTO "bobines_quantities" VALUES (0,10,0,10);
INSERT INTO "bobines_quantities" VALUES (11,20,0,20);
INSERT INTO "bobines_quantities" VALUES (21,30,0,30);
INSERT INTO "bobines_quantities" VALUES (31,40,5,40);
INSERT INTO "bobines_quantities" VALUES (41,50,5,50);
INSERT INTO "bobines_quantities" VALUES (51,60,5,60);
INSERT INTO "bobines_quantities" VALUES (61,70,10,60);
INSERT INTO "bobines_quantities" VALUES (71,80,10,60);
INSERT INTO "bobines_quantities" VALUES (81,90,10,60);
INSERT INTO "bobines_quantities" VALUES (91,100,15,60);
INSERT INTO "bobines_quantities" VALUES (101,110,15,60);
INSERT INTO "bobines_quantities" VALUES (111,120,20,60);
INSERT INTO "bobines_quantities" VALUES (121,180,20,60);
INSERT INTO "bobines_quantities" VALUES (181,240,30,90);
INSERT INTO "bobines_quantities" VALUES (241,360,40,90);
INSERT INTO "bobines_quantities" VALUES (361,480,60,120);
INSERT INTO "bobines_quantities" VALUES (481,1000,80,150);
INSERT INTO "bobines_quantities" VALUES (1001,1500,100,210);
INSERT INTO "bobines_quantities" VALUES (1501,2000,160,300);
INSERT INTO "bobines_quantities" VALUES (2001,2500,200,360);
INSERT INTO "bobines_quantities" VALUES (2501,3500,260,450);
INSERT INTO "bobines_quantities" VALUES (3501,4000,400,600);
INSERT INTO "bobines_quantities" VALUES (4001,5000,550,750);
INSERT INTO "bobines_quantities" VALUES (5001,10000,850,900);
INSERT INTO "bobines_quantities" VALUES (10001,20000,1500,1050);
INSERT INTO "bobines_quantities" VALUES (20001,40000,2500,4000);

INSERT INTO "refentes" VALUES ('R-140x7','P0001',0,140,140,140,140,140,140,140,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-140x6-Ch60','P0001',0,140,140,140,140,140,140,NULL,60,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-180x5','P0002',40,180,180,180,180,180,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-150x6','P0003',40,150,150,150,150,150,150,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-150x4-160-140','P0003',40,150,150,150,150,160,140,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-210x4-Ch60','P0004',40,210,210,210,210,NULL,NULL,NULL,60,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-210-240-210-240','P0004',0,210,240,210,240,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-210-240-190-260','P0004',0,210,240,190,260,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-210x4','P0004',40,210,210,210,210,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-240x3','P0004',0,240,240,240,NULL,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-320-260x2-Ch60','P0005',40,320,260,260,NULL,NULL,NULL,NULL,60,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-300x3','P0005',0,300,300,300,NULL,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-320x2-260','P0005',0,320,320,260,NULL,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-320-260x2','P0005',40,320,260,260,NULL,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-260x3-Ch180','P0005',40,260,260,260,NULL,NULL,NULL,NULL,180,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-260x3-Ch60','P0005',80,260,260,260,NULL,NULL,NULL,NULL,60,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-180-173.3x3-140x2','P0006',0,180,173.3,173.3,173.3,140,140,NULL,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-180-150-130x5','P0007',0,180,150,130,130,130,130,130,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-190-140-130x5','P0007',0,190,140,130,130,130,130,130,NULL,0,1558005719000);
INSERT INTO "refentes" VALUES ('R-150x4','P0003',40,150,150,150,150,NULL,NULL,NULL,NULL,0,1558005719000);

INSERT INTO "perfos" VALUES ('P0001',240,30,80,60,80,60,80,60,80,60,80,60,80,60,80,0,1558005719000);
INSERT INTO "perfos" VALUES ('P0002',240,90,80,100,80,100,80,100,80,100,80,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "perfos" VALUES ('P0003',240,75,80,70,80,70,80,70,80,70,80,70,80,NULL,NULL,0,1558005719000);
INSERT INTO "perfos" VALUES ('P0004',240,0,80,85,80,130,80,130,80,130,80,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "perfos" VALUES ('P0005',240,0,80,140,80,210,80,180,80,'',NULL,NULL,NULL,NULL,NULL,0,1558005719000);
INSERT INTO "perfos" VALUES ('P0006',240,50,80,100,80,90,80,95,80,75,80,60,80,NULL,NULL,0,1558005719000);
INSERT INTO "perfos" VALUES ('P0007',240,50,80,85,80,60,80,50,80,50,80,50,80,50,80,0,1558005719000);

INSERT INTO "operations" VALUES (1, "Reglage perforation", 1, "changement-perforation", 2400, 'repartissable');
INSERT INTO "operations" VALUES (2, "Reglage buses & bandes téflon", 1, "changement-refente", 900, 'aide');
INSERT INTO "operations" VALUES (3, "Réglage couteaux & passage produit sur axe enrouleur sup.", 1, "changement-refente", 900, 'aide');
INSERT INTO "operations" VALUES (4, "Réglage faisceau axes carton", 1, "changement-refente", 360, 'aide');
INSERT INTO "operations" VALUES (5, "Changement bobine mère papier", 1, "changement-bobine-mere-papier", 480, 'aide');
INSERT INTO "operations" VALUES (6, "Changement bobine mère polypro", 1, "changement-bobine-mere-polypro", 480, 'aide');
INSERT INTO "operations" VALUES (7, "Retirer clichets d'un groupe couleur", 1, "retrait-cliche", 300, 'conducteur');
INSERT INTO "operations" VALUES (8, "Montage de clichets", 1, "ajout-cliche", 270, 'conducteur');
INSERT INTO "operations" VALUES (9, "Réglage théorique", 1, "ajout-cliche", 120, 'conducteur');
INSERT INTO "operations" VALUES (10, "Nettoyage encrier", 1, "vidage-encrier", 120, 'aide');
INSERT INTO "operations" VALUES (11, "Remplissage encrier", 1, "remplissage-encrier", 120, 'aide');
INSERT INTO "operations" VALUES (12, "Callage à 25 m/min", 1, "cliche-multi-couleurs", 180, 'conducteur');
INSERT INTO "operations" VALUES (13, "Passage bandes sur 2 arbres enrouleurs", 1, "changement-refente", 360, 'conducteur');
INSERT INTO "operations" VALUES (14, "Second jog vérification couteau & buse", 1, "changement-refente", 180, 'conducteur');
INSERT INTO "operations" VALUES (15, "Temps de chauffe buse de colle à chaud", 1, "augmentation-refentes", 1800, 'chauffe-refente');
INSERT INTO "operations" VALUES (16, "Temps de chauffe perforation", 1, "changement-perforation", 4800, 'chauffe-perfo');

INSERT INTO "unplanned_stops" VALUES ("casse-calandre", "Calandre", "Casse", 1);
INSERT INTO "unplanned_stops" VALUES ("casse-groupe-enrouleur", "Groupe enrouleur", "Casse", 2);
INSERT INTO "unplanned_stops" VALUES ("casse-dérouleur-papier", "Dérouleur papier", "Casse", 3);
INSERT INTO "unplanned_stops" VALUES ("casse-dérouleur-polypro", "Dérouleur polypro", "Casse", 4);
INSERT INTO "unplanned_stops" VALUES ("casse-perforation", "Perforation", "Casse", 5);
INSERT INTO "unplanned_stops" VALUES ("casse-groupe-imprimeur", "Groupe imprimeur", "Casse", 6);
INSERT INTO "unplanned_stops" VALUES ("casse-cadre-guidage", "Cadre guidage", "Casse", 7);
INSERT INTO "unplanned_stops" VALUES ("mauvais-collage-buse-de-colle-à-chaud", "Buse de colle à chaud", "Mauvais collage", 8);
INSERT INTO "unplanned_stops" VALUES ("mauvais-collage-bobine-mère-polypro", "Bobine mère polypro", "Mauvais collage", 9);
INSERT INTO "unplanned_stops" VALUES ("mauvais-collage-changement-bande-téflon", "Changement bande téflon", "Mauvais collage", 10);
INSERT INTO "unplanned_stops" VALUES ("qualite-bobine-fille-impression", "Impression", "Problème qualité bobine fille", 11);
INSERT INTO "unplanned_stops" VALUES ("qualite-bobine-fille-largeur", "Largeur : Mauvaise position couteaux", "Problème qualité bobine fille", 12);
INSERT INTO "unplanned_stops" VALUES ("qualite-bobine-fille-défaut-perfo", "Défaut perfo", "Problème qualité bobine fille", 13);
INSERT INTO "unplanned_stops" VALUES ("qualite-bobine-fille-flanc-inconvenable", "Flanc bobine fille inconvenable", "Problème qualité bobine fille", 14);
INSERT INTO "unplanned_stops" VALUES ("qualite-bobine-mere-bord-flottant", "Bord flottant", "Problème qualité bobine mère", 15);
INSERT INTO "unplanned_stops" VALUES ("qualite-bobine-mere-choc-sur-bobine", "Choc sur bobine", "Problème qualité bobine mère", 16);
INSERT INTO "unplanned_stops" VALUES ("qualite-bobine-mere-raccord-fournisseur", "Raccord fournisseur", "Problème qualité bobine mère", 17);
INSERT INTO "unplanned_stops" VALUES ("autre-mauvais-encollage-axes-cartons", "Mauvais encollage axes cartons (colle à froid)", "Autre", 18);
INSERT INTO "unplanned_stops" VALUES ("autre-essai-technique", "Essai technique", "Autre", 19);

INSERT INTO "cleanings" VALUES ("calandre", "Calandre", 1);
INSERT INTO "cleanings" VALUES ("couteaux", "Couteaux", 2);
INSERT INTO "cleanings" VALUES ("contre-couteaux", "Contre-couteaux", 3);
INSERT INTO "cleanings" VALUES ("barre-axe-carton", "Barre axe carton", 4);
INSERT INTO "cleanings" VALUES ("lame-coupe", "Lame coupe", 5);
INSERT INTO "cleanings" VALUES ("bague-perfo", "Bague perfo", 6);
INSERT INTO "cleanings" VALUES ("bras-appuis", "Bras d'appuis", 7);

INSERT INTO "prod_hours" VALUES ("lundi", 6, 0, 22, 0);
INSERT INTO "prod_hours" VALUES ("mardi", 6, 0, 22, 0);
INSERT INTO "prod_hours" VALUES ("mercredi", 6, 0, 22, 0);
INSERT INTO "prod_hours" VALUES ("jeudi", 6, 0, 22, 0);
INSERT INTO "prod_hours" VALUES ("vendredi", 6, 0, 20, 0);

INSERT INTO "constants" VALUES ("nombreEncriers", "3");
INSERT INTO "constants" VALUES ("maxSpeed", "180");
INSERT INTO "constants" VALUES ("maxSpeedRatio", "0.82");
INSERT INTO "constants" VALUES ("reglageRepriseProdMs", "1200000");

COMMIT;
