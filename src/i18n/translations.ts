export const languages = { en: 'English', es: 'Español' } as const;
export type Lang = keyof typeof languages;

const t = {
	en: {
		// Nav
		'nav.home': 'Home',
		'nav.projects': 'Projects',
		'nav.research': 'Research',
		'nav.now': 'Now',
		'nav.contact': 'Contact',

		// Hero
		'hero.tagline': 'Researcher by day, builder by curiosity.',
		'hero.role': 'Computer Vision Researcher',
		'hero.institution': 'GTI · UPM · Madrid',

		// Bio
		'bio.title': 'About me',
		'bio.p1': 'Researcher at GTI-UPM working on egocentric video understanding and embodied intelligence — how AI perceives the world from a first-person perspective. I\'m particularly drawn to making that intelligence run lean: optimizing vision-language models for edge devices like Raspberry Pi, where computation meets the real world.',
		'bio.p2': 'Outside the lab, I enjoy building things at the intersection of AI and the physical — side projects that usually start as a sketch and end up as a prototype.',

		// Interests
		'interests.label': 'Interests',
		'interests.1': 'Egocentric video',
		'interests.2': 'Embodied intelligence',
		'interests.3': 'VLM for edge devices',
		'interests.4': '3D printing & NFC',

		// Research areas (skills box)
		'research.area1.title': 'Egocentric Video',
		'research.area1.desc': 'First-person video perception and action recognition from wearable cameras.',
		'research.area2.title': 'VLM for Edge',
		'research.area2.desc': 'Quantization and efficient inference of vision-language models on embedded hardware.',
		'research.area3.title': 'Embodied Intelligence',
		'research.area3.desc': 'Connecting perception models to physical world interaction and action understanding.',

		// Projects page
		'projects.title': 'My Projects',
		'projects.subtitle': 'Side projects at the intersection of AI and the physical world.',
		'projects.featured': 'Featured Projects',

		// Research page
		'research.title': 'Research',
		'research.subtitle': 'My work at GTI-UPM, Universidad Politécnica de Madrid.',
		'research.lines': 'Research Lines',
		'research.publications': 'Publications',
		'research.nopubs': 'Publications coming soon.',

		// Currently building
		'building.label': 'Currently Building',
		'building.latest': 'Latest update',
		'building.follow': 'Follow the build',

		// Now page
		'now.title': 'Now',
		'now.intro': 'What I\'m focused on this month.',
		'now.updated': 'Last updated',

		// Log entries
		'log.en_only': 'This entry is written in English.',
		'log.build_log': 'Build Log',
		'log.entry': 'Entry',
		'log.prev': 'Previous',
		'log.next': 'Next',

		// Contact CTA
		'contact.cta': 'Want to connect?',
		'contact.button': 'Get in touch',

		// Contact page
		'contact.title': 'Contact',
		'contact.desc': 'Find me on the web or send me an email.',
		'contact.email': 'Email',
		'contact.github': 'GitHub',
		'contact.linkedin': 'LinkedIn',
	},
	es: {
		// Nav
		'nav.home': 'Inicio',
		'nav.projects': 'Proyectos',
		'nav.research': 'Investigación',
		'nav.now': 'Ahora',
		'nav.contact': 'Contacto',

		// Hero
		'hero.tagline': 'Investigador de día, constructor por curiosidad.',
		'hero.role': 'Investigador en Visión por Computador',
		'hero.institution': 'GTI · UPM · Madrid',

		// Bio
		'bio.title': 'Sobre mí',
		'bio.p1': 'Investigador en el GTI-UPM trabajando en comprensión de vídeo egocéntrico e inteligencia encarnada: cómo la IA percibe el mundo desde una perspectiva en primera persona. Me apasiona hacer esa inteligencia eficiente: optimizando modelos de visión-lenguaje para dispositivos como Raspberry Pi, donde la computación se encuentra con el mundo real.',
		'bio.p2': 'Fuera del laboratorio, disfruto construyendo cosas en la intersección entre la IA y lo físico — proyectos que suelen empezar como un boceto y acaban siendo un prototipo.',

		// Interests
		'interests.label': 'Intereses',
		'interests.1': 'Vídeo egocéntrico',
		'interests.2': 'Inteligencia encarnada',
		'interests.3': 'VLM para edge',
		'interests.4': 'Impresión 3D y NFC',

		// Research areas
		'research.area1.title': 'Vídeo Egocéntrico',
		'research.area1.desc': 'Percepción de vídeo en primera persona y reconocimiento de acciones desde cámaras portables.',
		'research.area2.title': 'VLM para Edge',
		'research.area2.desc': 'Cuantización e inferencia eficiente de modelos de visión-lenguaje en hardware embebido.',
		'research.area3.title': 'Inteligencia Encarnada',
		'research.area3.desc': 'Conectar modelos de percepción con la interacción física y la comprensión de acciones.',

		// Projects page
		'projects.title': 'Mis Proyectos',
		'projects.subtitle': 'Proyectos personales en la intersección entre IA y el mundo físico.',
		'projects.featured': 'Proyectos Destacados',

		// Research page
		'research.title': 'Investigación',
		'research.subtitle': 'Mi trabajo en el GTI-UPM, Universidad Politécnica de Madrid.',
		'research.lines': 'Líneas de Investigación',
		'research.publications': 'Publicaciones',
		'research.nopubs': 'Publicaciones próximamente.',

		// Currently building
		'building.label': 'Construyendo ahora',
		'building.latest': 'Última actualización',
		'building.follow': 'Seguir el build',

		// Now page
		'now.title': 'Ahora',
		'now.intro': 'En qué estoy centrado este mes.',
		'now.updated': 'Actualizado',

		// Log entries
		'log.en_only': 'Esta entrada está escrita en inglés.',
		'log.build_log': 'Diario de construcción',
		'log.entry': 'Entrada',
		'log.prev': 'Anterior',
		'log.next': 'Siguiente',

		// Contact CTA
		'contact.cta': '¿Quieres conectar?',
		'contact.button': 'Escríbeme',

		// Contact page
		'contact.title': 'Contacto',
		'contact.desc': 'Encuéntrame en la web o mándame un email.',
		'contact.email': 'Email',
		'contact.github': 'GitHub',
		'contact.linkedin': 'LinkedIn',
	},
} as const;

export function useTranslations(lang: Lang) {
	return (key: keyof typeof t.en) => t[lang][key] ?? t.en[key];
}

export function getAlternateLangPath(lang: Lang, currentPath: string): string {
	if (lang === 'en') {
		return '/es' + (currentPath === '/' ? '' : currentPath);
	}
	return currentPath.replace(/^\/es/, '') || '/';
}
