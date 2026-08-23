import { createBrowserRouter } from 'react-router';
import Root from './layouts/Root';
import Home from './pages/Home';
import Work from './pages/Work';
import CaseStudy from './pages/CaseStudy';
import Writing from './pages/Writing';
import Article from './pages/Article';
import About from './pages/About';
import Contact from './pages/Contact';
import DesignSystem from './pages/DesignSystem';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'work', Component: Work },
      { path: 'work/:slug', Component: CaseStudy },
      { path: 'writing', Component: Writing },
      { path: 'writing/:slug', Component: Article },
      { path: 'about', Component: About },
      { path: 'contact', Component: Contact },
      { path: 'design-system', Component: DesignSystem },
    ],
  },
]);
