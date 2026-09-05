// PA-specific exam law content — 10 sections, 72 facts.
// Ported from the original single-file app; text is unchanged.

export type PASection = { title: string; icon: string; facts: string[] }

export const PA_CONTENT: PASection[] = [
  {
    title: 'RELRA — Real Estate Licensing and Registration Act',
    icon: 'scale',
    facts: [
      'Administrada por el Pennsylvania Department of State a través de la State Real Estate Commission.',
      'La Comisión tiene 11 miembros nombrados por el Gobernador: 6 corredores, 2 vendedores y 3 miembros del público.',
      'Licencia de VENDEDOR: 75 horas de educación pre-licencia + aprobar el examen.',
      'Licencia de CORREDOR: 240 horas de educación pre-licencia + experiencia previa como vendedor.',
      'Renovación bienal (cada 2 años): 14 horas de educación continua (3.5 hrs Fair Housing + 3.5 hrs Ética).',
      'Edad mínima para licenciarse: 18 años.',
      'Después de aprobar el examen, el candidato tiene 6 meses para solicitar la licencia.',
      'Sanciones: revocación, suspensión, probatoria, multas hasta $1,000 por violación.',
      'Para abrir sucursal: licencia de sucursal + gerente de sucursal que sea corredor licenciado.',
      'Terminación de vendedor: el corredor tiene 10 días para notificar a la Comisión.',
    ],
  },
  {
    title: 'Consumer Notice — Aviso al Consumidor',
    icon: 'clipboard',
    facts: [
      'OBLIGATORIO entregar al consumidor en el PRIMER CONTACTO SUSTANTIVO que involucre una propiedad específica.',
      'Informa sobre los tipos de relaciones de agencia disponibles en Pennsylvania.',
      'Debe obtenerse acuse de recibo firmado del consumidor.',
      'El licenciatario DEBE entregarlo — no puede omitirlo.',
      'Aplica tanto a compradores como a vendedores potenciales.',
    ],
  },
  {
    title: 'Tipos de Agencia en Pennsylvania',
    icon: 'handshake',
    facts: [
      'AGENTE DEL VENDEDOR: representa solo al vendedor con plenos deberes fiduciarios.',
      'AGENTE DEL COMPRADOR: representa solo al comprador con plenos deberes fiduciarios.',
      'AGENTE DUAL: representa a AMBAS partes en la misma transacción — requiere consentimiento escrito de AMBAS partes.',
      'AGENTE DESIGNADO: un vendedor dentro de la firma designado para representar solo UNA parte, mientras el corredor es el agente dual.',
      'TRANSACTION LICENSEE: facilita la transacción sin representar a ninguna parte — deberes limitados (honestidad, divulgación de hechos materiales, actos ministeriales).',
      'Deberes fiduciarios (a clientes): Lealtad, Confidencialidad, Obediencia, Rendición de cuentas, Cuidado razonable.',
      'Deberes a TODAS las partes: trato honesto, divulgación de hechos materiales, presentar todas las ofertas.',
    ],
  },
  {
    title: 'Impuesto de Transferencia Inmobiliaria de Pennsylvania',
    icon: 'money',
    facts: [
      'Tasa total: 2% del precio de venta.',
      'Típicamente dividido: 1% paga el comprador y 1% paga el vendedor (negociable en el contrato).',
      'El 1% estatal va al estado; el 1% local va al municipio/condado.',
      'Se paga al momento del cierre.',
      'Algunos municipios tienen tasas diferentes al 1% local estándar.',
    ],
  },
  {
    title: 'Ley de Arrendador-Inquilino de Pennsylvania',
    icon: 'home',
    facts: [
      'Depósito de seguridad máximo: 2 meses de alquiler el primer año; 1 mes a partir del segundo año.',
      'Devolución del depósito: dentro de 30 días después de terminar el arrendamiento.',
      'Si el arrendador retiene injustamente: puede deber el doble del monto retenido.',
      'Aviso de desalojo por falta de pago: 10 días de aviso escrito antes de presentar queja.',
      'Arrendamiento mes a mes: 30 días de aviso para terminar.',
      'El proceso de desalojo va a través del Tribunal de Distrito Magistral (Magisterial District Court).',
      'Auto-ayuda del arrendador (cambiar cerraduras, quitar pertenencias) es ILEGAL en Pennsylvania.',
      'Garantía implícita de habitabilidad: el arrendador debe mantener la propiedad en condiciones seguras y habitables.',
    ],
  },
  {
    title: 'Pennsylvania Real Estate Seller Disclosure Law',
    icon: 'document',
    facts: [
      'Los vendedores DEBEN completar el formulario SPDS (Seller\'s Property Disclosure Statement).',
      'Debe divulgar todos los DEFECTOS MATERIALES CONOCIDOS que afectan la propiedad.',
      'El lenguaje \'as is\' NO elimina la obligación de divulgación.',
      'Aplica a propiedades residenciales (1-4 unidades).',
      'Si el vendedor descubre un defecto después de entregar el formulario, debe actualizar la divulgación.',
      'El comprador puede rescindir el contrato si recibe la divulgación y hay defectos materiales no divulgados.',
    ],
  },
  {
    title: 'Pennsylvania Human Relations Act (PHRA)',
    icon: 'scale',
    facts: [
      'Protege CLASES ADICIONALES a la Fair Housing federal: EDAD (age) y ASCENDENCIA (ancestry).',
      'Aplica a propiedades residenciales y comerciales en Pennsylvania.',
      'Las quejas se presentan ante la Pennsylvania Human Relations Commission (PHRC).',
      'Clases protegidas federales + PA: raza, color, religión, origen nacional, sexo, estado familiar, discapacidad, EDAD, ASCENDENCIA.',
      'También prohíbe discriminación en empleo y lugares públicos.',
    ],
  },
  {
    title: 'Licencia de Pennsylvania — Datos Clave para el Examen',
    icon: 'target',
    facts: [
      'Horas pre-licencia VENDEDOR: 75 horas.',
      'Horas pre-licencia CORREDOR: 240 horas.',
      'Renovación: cada 2 años (bienal).',
      'Educación continua: 14 horas por renovación.',
      'Comisión: 11 miembros (6 corredores + 2 vendedores + 3 público).',
      'Multa máxima por violación: $1,000.',
      'Plazo para depositar earnest money: 3 días hábiles.',
      'Plazo para notificar terminación de vendedor: 10 días.',
      'Plazo para solicitar licencia tras aprobar examen: 6 meses.',
      'Edad mínima: 18 años.',
      'Net listings: ILEGALES en Pennsylvania.',
      'Fondos de clientes: en cuenta de fideicomiso SEPARADA (sin commingling).',
    ],
  },
  {
    title: 'Radon en Pennsylvania',
    icon: 'radiation',
    facts: [
      'Pennsylvania es uno de los estados con MAYOR concentración de radón en EE.UU.',
      'El radón es un gas radiactivo natural, incoloro e inodoro que se filtra desde el suelo.',
      'Nivel de acción de la EPA: 4 pCi/L o más.',
      'Se detecta con pruebas especiales (corto o largo plazo).',
      'Los agentes inmobiliarios deben informar a los compradores sobre el riesgo del radón.',
      'Los mitigadores de radón deben estar certificados en Pennsylvania.',
      'La divulgación del radón conocido es parte del SPDS (formulario de divulgación del vendedor).',
    ],
  },
  {
    title: 'Zonificación y Uso del Suelo en Pennsylvania',
    icon: 'map',
    facts: [
      'La zonificación es un poder de policía del gobierno — regula el uso del suelo.',
      'VARIANCE: permiso para desviarse de los requisitos de zonificación cuando causarían dificultad innecesaria.',
      'NONCONFORMING USE: uso preexistente que no cumple la zonificación actual pero es permitido continuar.',
      'CONDITIONAL USE: uso permitido bajo condiciones específicas aprobadas por la junta de zonificación.',
      'SPOT ZONING: cambio de zonificación para una sola propiedad que no es consistente con el plan general — generalmente ilegal.',
      'BUFFER ZONE: área de transición entre usos incompatibles (ej: entre industrial y residencial).',
      'Los condados y municipios en Pennsylvania tienen amplia autoridad de zonificación bajo el Municipalities Planning Code (MPC).',
    ],
  },
]
