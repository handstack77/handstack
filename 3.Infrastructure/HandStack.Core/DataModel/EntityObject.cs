using System.Collections.Generic;

namespace HandStack.Core.DataModel
{
    public abstract class EntityObject : BaseEntity
    {
        protected static readonly string versionDefault = "NotSet";

        private List<BusinessRule> businessRules = new List<BusinessRule>();
        private List<string> validationErrors = new List<string>();

        public List<BusinessRule> BusinessRules
        {
            get { return businessRules; }
            set { businessRules = value; }
        }

        public List<string> ValidationErrors
        {
            get { return validationErrors; }
        }

        protected void AddRule(BusinessRule rule)
        {
            businessRules.Add(rule);
        }

        protected void RemoveAtRule(int index)
        {
            businessRules.RemoveAt(index);
        }

        public bool Validate()
        {
            bool IsValid = true;

            validationErrors.Clear();

            foreach (BusinessRule Rule in businessRules)
            {
                if (Rule.Validate(this) == false)
                {
                    IsValid = false;
                    validationErrors.Add(Rule.ErrorMessage);
                }
            }
            return IsValid;
        }
    }
}
