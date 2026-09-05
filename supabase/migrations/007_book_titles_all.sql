-- All 22 unit titles verbatim from the textbook's table of contents.
-- Safe to apply now that the questions have been renumbered to match.

update units set title_en='Real Property and the Law',                         title_es='Propiedad Real y la Ley'                          where id=1;
update units set title_en='Land-Use Controls and Property Development',        title_es='Controles de Uso del Suelo y Desarrollo'          where id=2;
update units set title_en='Environmental Issues in Real Estate',               title_es='Asuntos Ambientales en Bienes Raíces'             where id=3;
update units set title_en='Legal Descriptions',                                title_es='Descripciones Legales'                            where id=4;
update units set title_en='Interests in Real Estate',                          title_es='Intereses en Bienes Raíces'                       where id=5;
update units set title_en='Forms of Real Estate Ownership',                    title_es='Formas de Propiedad Inmobiliaria'                 where id=6;
update units set title_en='Real Estate Taxes and Liens',                       title_es='Impuestos y Gravámenes Inmobiliarios'             where id=7;
update units set title_en='Transfer of Title',                                 title_es='Transferencia de Título'                          where id=8;
update units set title_en='Title Records',                                     title_es='Registros de Título'                              where id=9;
update units set title_en='Real Estate Contracts',                             title_es='Contratos Inmobiliarios'                          where id=10;
update units set title_en='Principles of Real Estate Financing',               title_es='Principios de Financiamiento Inmobiliario'        where id=11;
update units set title_en='Pennsylvania Real Estate Licensing Law',            title_es='Ley de Licencias Inmobiliarias de Pensilvania',   is_pa_specific=true where id=12;
update units set title_en='The Real Estate Business',                          title_es='El Negocio Inmobiliario'                          where id=13;
update units set title_en='Real Estate Brokerage',                             title_es='Corretaje Inmobiliario'                           where id=14;
update units set title_en='Agency in Real Estate',                             title_es='Agencia en Bienes Raíces'                         where id=15;
update units set title_en='Ethical Practices and Fair Housing',                title_es='Prácticas Éticas y Vivienda Justa'                where id=16;
update units set title_en='Listing Agreements and Buyer Representation Contracts', title_es='Contratos de Listado y Representación del Comprador' where id=17;
update units set title_en='Sales Contracts',                                   title_es='Contratos de Venta'                               where id=18;
update units set title_en='Financing the Real Estate Transaction',             title_es='Financiamiento de la Transacción Inmobiliaria'    where id=19;
update units set title_en='Appraising Real Estate',                            title_es='Tasación Inmobiliaria'                            where id=20;
update units set title_en='Closing the Real Estate Transaction',               title_es='Cierre de la Transacción Inmobiliaria'            where id=21;
update units set title_en='Leasing and Property Management',                   title_es='Arrendamiento y Administración de Propiedades'    where id=22;

-- Units with no questions yet stay hidden from the study picker.
update units set enabled = (select count(*) > 0 from questions q where q.unit_id = units.id);
