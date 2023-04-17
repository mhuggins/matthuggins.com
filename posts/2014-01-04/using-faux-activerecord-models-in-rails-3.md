Implementing forms that are associated with models -- specifically ActiveRecord objects -- is pretty common when developing with Ruby on Rails. In fact, the built-in [form_for](https://api.rubyonrails.org/classes/ActionView/Helpers/FormHelper.html#method-i-form_for) helper method and its associated field helper methods all assume that you're working with some kind of persisted object. This can be seen in the basic syntax and its method signature.

```erb
<%= form_for @user do |f| %>
  <%= f.label :first_name %>
  <%= f.text_field :first_name %>

  <%= f.label :last_name %>
  <%= f.text_field :last_name %>
<%= end %>
```

This is great for persisted objects with datastore-backed representations. But what happens when you need a complex form that does not reflect a persisted record of some sort?

One approach would be to use the simplistic [form_tag](https://api.rubyonrails.org/classes/ActionView/Helpers/FormTagHelper.html#method-i-form_tag) helper with custom fields doing what you need. This works, but if you're collecting data from more than one field (e.g.: not just a simple search query), your code can get hairy quickly. You'll probably find that you have a lot of logic in your controller to deal with the many form params, something that is less than ideal. Additionally, if you're using a gem like [SimpleForm](https://github.com/heartcombo/simple_form) or [Formtastic](https://github.com/formtastic/formtastic), you won't be able to take advantage of their features for this one-off form.

A cleaner, more flexible approach would be to use a model whose attributes represent your form inputs, despite it not being an ActiveRecord model. While this can technically be as easy as creating a pure Ruby class with accessors, a little extra work is needed to make it work with Rails. Let's dive into what we need to do.

First, let's make a few assumptions. Let's assume we're working with a search form. Rather than it just being a text field that holds the query, let's assume it has a few more pieces of info. There will be a checkbox to mark a search for "SafeSearch" (in the same vein as Google Image searches), and there will be a select box to change the number of results per page to some preset available options. Let's sketch out our model.

```ruby
class Search
  attr_accessor :query, :safe_search, :results_per_page
end
```

The above model is incredibly simplistic. It creates getter and setter methods for our inputs without any regard for their expected types, assuming they are represented correctly. We know, though, that `safe_search` actually represents a boolean while `results_per_page` represents an integer. Since the data is coming from the context of a Rails form, it will be represented as a string, leaving the appropriate conversions to us. Let's handle this before moving on.

```ruby
class Search
  TRUE_VALUES = ActiveRecord::ConnectionAdapters::Column::TRUE_VALUES

  attr_accessor :query
  attr_reader :safe_search, :results_per_page

  alias_method :safe_search?, :safe_search

  def results_per_page=(value)
    @results_per_page = value.to_i
  end

  def safe_search=(value)
    @safe_search = TRUE_VALUES.include?(value)
  end
end
```

We're now converting our `results_per_page` to an integer and `safe_search` to a boolean. The `TRUE_VALUES` constant comes from ActiveRecord, per the [documentation](https://api.rubyonrails.org/v3.0.0/classes/ActiveRecord/ConnectionAdapters/Column.html). For convenience, we've added a `safe_search?` method alias since it is a boolean.

At this point, you might think that it's safe to go ahead and use this class in your form. If you're using `form_for` or one of the form gems mentioned previously, you'll end up encountering some kind of exception though. This comes down to a variety of things. First, the only way you can assign attributes is to manually set them through the setter methods. Because we have a hash of parameters submitted to the controller, and because the controller shouldn't know the ins and outs of the model it's working with, it's not convenient to assign these values on our model one at a time. Let's make it easy to pass the hash into our model by creating an initializer.

```ruby
class Search
  def initialize(attributes = {})
    assign_attributes(attributes)
  end

  def assign_attributes(values)
    values.each do |k, v|
      send("#{k}=", v)
    end
  end

  # code snipped ...
end
```

At this point, we can now pass a hash in to assign all our values. However, this implementation is "dumb" for two reasons. First, it assumes that every hash key passed in exists as a setter on the model. If the hash contained the key "foo", then we'd attempt to call `foo=` on our model, raising an exception. Second, this is not accounting for mass assignment sanitization. Let's take care of that by implementing the [ActiveModel::MassAssignmentSecurity](https://api.rubyonrails.org/v3.2.13/classes/ActiveModel/MassAssignmentSecurity/ClassMethods.html) concern.

```ruby
class Search
  include ActiveModel::MassAssignmentSecurity

  attr_accessible :query, :safe_search, :results_per_page

  def initialize(attributes = {})
    assign_attributes(attributes)
    yield(self) if block_given?
  end

  def assign_attributes(values, options = {})
    sanitize_for_mass_assignment(values, options[:as]).each do |k, v|
      send("#{k}=", v)
    end
  end

  # code snipped ...
end
```

We no longer have to worry about invalid hash keys or attributes on our model that have not been marked as accessible. As a necessary bonus, our `assign_attributes` method signature now matches that of ActiveRecord models, meaning we can use our model interchangeably in that regards.

There is still a problem though. Our model is missing some methods needed to make it work with Rails forms. This can be solved by including the [ActiveModel::Conversion](https://api.rubyonrails.org/classes/ActiveModel/Conversion.html) concern per the documentation. While we're at it, let's include the [ActiveModel::Validations](https://api.rubyonrails.org/classes/ActiveModel/Validations.html) concern so that we can permit specific values on the results per page. (I'm assuming you don't want to allow a 20-minute query & page load due to a user changing the URL to allow millions of results per page!)

```ruby
class Search
  RESULTS_PER_PAGE = [10, 25, 50, 100].freeze

  include ActiveModel::Conversion
  include ActiveModel::Validations

  validates :query, presence: true
  validates :results_per_page, presence: true, inclusion: { in: RESULTS_PER_PAGE }

  def persisted?
    false
  end

  # code snipped ...
end
```

Success! You can now easily use your model with your form. Let's take a look at some example controller and view usage just to see how it works. Let's assume we're using SimpleForm as well.

**app/controller/search_controller.rb:**

```ruby
def new
  @search = Search.new
end

def create
  @search = Search.new(params[:search])

  # TODO: use the @search object to perform a search.  Adding
  # a `results` method on the search object might be a good starting point.
end
```

**app/views/search/new.html.erb:**

```erb
<%= simple_form_for @search do |f| %>
  <%= f.input :query %>
  <%= f.input :safe_search, as: :boolean %>
  <%= f.input :results_per_page, collection: Search::RESULTS_PER_PAGE, include_blank: false %>
<%= end %>
```

We now have a fully functional search form with everything encapsulated in the model.

Let's take this a step further though and pretend that multiple models will require this functionality. We can split out the common code into a model that can be included. Here's what this would look like for our existing Search model.

**app/models/concerns/mock_model.rb:**

```ruby
require 'active_support/concern'

module MockModel
  extend ActiveSupport::Concern

  included do
    include ActiveModel::Conversion
    include ActiveModel::Validations
    include ActiveModel::MassAssignmentSecurity
  end

  def initialize(attributes = {})
    assign_attributes(attributes)
    yield(self) if block_given?
  end

  def persisted?
    false
  end

  def assign_attributes(values, options = {})
    sanitize_for_mass_assignment(values, options[:as]).each do |k, v|
      send("#{k}=", v)
    end
  end
end
```

**app/models/search.rb:**

```ruby
class Search
  TRUE_VALUES = ActiveRecord::ConnectionAdapters::Column::TRUE_VALUES
  RESULTS_PER_PAGE = [10, 25, 50, 100].freeze

  include MockModel

  attr_accessor :query
  attr_reader :safe_search, :results_per_page

  alias_method :safe_search?, :safe_search

  validates :query, presence: true
  validates :results_per_page, presence: true, inclusion: { in: RESULTS_PER_PAGE }

  def results_per_page=(value)
    @results_per_page = value.to_i
  end

  def safe_search=(value)
    @safe_search = TRUE_VALUES.include?(value)
  end
end
```

All that's required by your models is the inclusion of the `MockModel` concern along with some custom validations and mass assignment protection -- standard steps for your ActiveRecord models.

Hope this helps. Happy coding!