import { prisma } from '../prisma.js';

const defaultSlides = [
  {
    title: 'Ma vision',
    content: 'Présente ici la vision et les objectifs de ton projet.',
    order: 0,
    duration: 5,
  },
];

const normalizeSlide = (slide, index) => ({
  title: typeof slide.title === 'string' ? slide.title.trim() : '',
  content: typeof slide.content === 'string' ? slide.content.trim() || null : null,
  imageUrl: typeof slide.imageUrl === 'string' ? slide.imageUrl.trim() || null : null,
  order: index,
  duration: Number.isInteger(slide.duration) ? Math.min(Math.max(slide.duration, 3), 60) : 5,
});

export const getSlideshow = async (req, res) => {
  try {
    const slideshow = await prisma.slideshow.findFirst({
      where: { userId: req.user.id },
      include: { slides: { orderBy: { order: 'asc' } } },
    });

    res.json(slideshow || {
      id: null,
      title: 'Ma présentation',
      description: '',
      slides: defaultSlides,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveSlideshow = async (req, res) => {
  try {
    const { title, description, slides = [] } = req.body;
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';

    if (!normalizedTitle) {
      return res.status(400).json({ message: 'Le titre de la présentation est requis.' });
    }

    if (!Array.isArray(slides) || slides.length < 1 || slides.length > 50) {
      return res.status(400).json({ message: 'La présentation doit contenir entre 1 et 50 diapositives.' });
    }

    const normalizedSlides = slides.map(normalizeSlide);
    if (normalizedSlides.some((slide) => !slide.title)) {
      return res.status(400).json({ message: 'Chaque diapositive doit avoir un titre.' });
    }

    const slideshow = await prisma.slideshow.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        title: normalizedTitle,
        description: typeof description === 'string' ? description.trim() || null : null,
        slides: { create: normalizedSlides },
      },
      update: {
        title: normalizedTitle,
        description: typeof description === 'string' ? description.trim() || null : null,
        slides: {
          deleteMany: {},
          create: normalizedSlides,
        },
      },
      include: { slides: { orderBy: { order: 'asc' } } },
    });

    res.json(slideshow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
