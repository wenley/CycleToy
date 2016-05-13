
import VNode from 'virtual-dom/vnode/vnode';
import VText from 'virtual-dom/vnode/vtext';

import ConvertFactory from 'html-to-vdom';

const converter = ConvertFactory({
  VNode,
  VText,
});

const template = (templateName, context) =>
  converter(Handlebars.templates[templateName](context).trim());

export default template;
