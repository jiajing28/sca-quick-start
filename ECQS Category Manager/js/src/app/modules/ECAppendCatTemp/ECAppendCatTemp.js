// Add ECQS Category Templates to template hash

(function(application)
{
 if (!window.ECCategoryIncluded)
 {
  window.ECCategoryIncluded = true;
  SC.ECCatTemplates.macros = _.union(SC.templates.macros, SC.ECCatTemplates.macros);
  SC.templates = _.extend(SC.templates, SC.ECCatTemplates);
  
  SC.compileMacros(SC.templates.macros);
 }
 
})(SC.Application('Shopping'));