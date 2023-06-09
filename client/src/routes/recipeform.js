import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { DropdownList } from 'react-widgets';
import { toast } from 'react-toastify';

const RecipeForm = () => {
  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm();
  const { fields: ingredientsFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({ control, name: 'ingredients' });
  const { fields: instructionsFields, append: appendInstruction, remove: removeInstruction } = useFieldArray({ control, name: 'instructions' });
  const navigate = useNavigate();
  const { recipeId } = useParams();
  
  const [creatorsList, setCreatorsList] = useState([]);
  const [isQuantityEnabled, setIsQuantityEnabled] = useState(true);
  const [isUnitEnabled, setIsUnitEnabled] = useState(true);

  useEffect(() => {
    // Fetch users from the server using an API endpoint
    axios
      .get('http://localhost:5000/api/users')
      .then((response) => {
        // Extract usernames from the response data
        const usernames = response.data.map((user) => user.username);
        setCreatorsList(usernames);
      })
      .catch((error) => {
        console.error(error);
      });
      
    // Fetch recipe data based on the provided recipeId
    axios
      .get(`http://localhost:5000/api/recipes/${recipeId}`)
      .then((response) => {
        const recipeData = response.data;
        
        // Populate form fields with the retrieved recipe data
        setValue('name', recipeData.name);
        setValue('creator', recipeData.creator);
        setValue('description', recipeData.description);
        setValue('servingSize', recipeData.servingSize);
        setValue('cookingTime.length', recipeData.cookingTime.length);
        setValue('cookingTime.unit', recipeData.cookingTime.unit);
        
        // Populate ingredients fields
        recipeData.ingredients.forEach((ingredient) => {
          appendIngredient(ingredient);
        });
        
        // Populate instructions fields
        recipeData.instructions.forEach((instruction) => {
          appendInstruction(instruction);
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }, [recipeId, appendIngredient, appendInstruction, setValue]);

  const onSubmit = async (data) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/recipes/${recipeId}`, data);
      if (response.status === 200) {
        toast.success(`Successfully updated ${data.name}`);
        navigate('/recipes');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        const errorMessage = error.response.data.message;
        toast.error(errorMessage);
      } else {
        console.error(error);
      }
    }
  };

  const handleQuantityCheckboxChange = (event) => {
    setIsQuantityEnabled(event.target.checked);
  };

  const handleUnitCheckboxChange = (event) => {
    setIsUnitEnabled(event.target.checked);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      <div>
        <label>Recipe Title:</label>
        <input type="text" {...register('name', { required: true })} />
        {errors?.name && <span>This field is required</span>}
      </div>

      <div>
        <label>Creator:</label>
        <Controller
          control={control}
          name="creator"
          rules={{ required: true }}
          render={({ field }) => (
            <DropdownList
              {...field}
              data={creatorsList}
              onChange={(value) => field.onChange(value)}
              onBlur={(event) => field.onBlur(event.target.value)}
            />
          )}
        />
        {errors?.creator && <span>This field is required</span>}
      </div>

      <div>
        <label>Description:</label>
        <input type="text" {...register('description', { required: true })} />
        {errors?.description && <span>This field is required</span>}
      </div>

      <div>
        <label>Serving Size:</label>
        <input type="number" {...register('servingSize', { required: true })} />
        {errors?.servingSize && <span>This field is required</span>}
      </div>

      <div>
        <label>Cooking Time:</label>
        <div>
          <label>Length:</label>
          <input type="number" {...register('cookingTime.length', { required: true })} />
          {errors?.cookingTime?.length && <span>This field is required</span>}
        </div>
        <div>
          <label>Unit:</label>
          <input type="text" {...register('cookingTime.unit', { required: true })} />
          {errors?.cookingTime?.unit && <span>This field is required</span>}
        </div>
      </div>

      <div>
        <label>Ingredients:</label>
        <ul>
          {ingredientsFields.map((field, index) => (
            <li key={field.id}>
              <input
                type="text"
                {...register(`ingredients[${index}].name`, { required: true })}
                defaultValue={field.name}
              />
              {errors?.ingredients?.[index]?.name && <span>This field is required</span>}

              <label>
                <input
                  type="checkbox"
                  checked={isQuantityEnabled}
                  onChange={handleQuantityCheckboxChange}
                />
                Quantity:
              </label>
              {isQuantityEnabled && (
                <>
                  <input
                    type="number"
                    {...register(`ingredients[${index}].quantity`, { required: isQuantityEnabled })}
                    defaultValue={field.quantity}
                  />
                  {errors?.ingredients?.[index]?.quantity && <span>This field is required</span>}
                </>
              )}

              <label>
                <input
                  type="checkbox"
                  checked={isUnitEnabled}
                  onChange={handleUnitCheckboxChange}
                />
                Unit:
              </label>
              {isUnitEnabled && (
                <>
                  <input
                    type="text"
                    {...register(`ingredients[${index}].unit`, { required: isUnitEnabled })}
                    defaultValue={field.unit}
                  />
                  {errors?.ingredients?.[index]?.unit && <span>This field is required</span>}
                </>
              )}

              <button type="button" onClick={() => removeIngredient(index)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => appendIngredient({ name: '', quantity: 0, unit: '' })}>
          Add Ingredient
        </button>
      </div>

      <div>
        <label>Instructions:</label>
        <ul>
          {instructionsFields.map((field, index) => (
            <li key={field.id}>
              <input
                type="text"
                {...register(`instructions[${index}]`, { required: true })}
                defaultValue={field}
              />
              {errors?.instructions?.[index] && <span>This field is required</span>}
              <button type="button" onClick={() => removeInstruction(index)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => appendInstruction('')}>
          Add Instruction
        </button>
      </div>

      <button type="submit">Submit</button>
    </form>
  );
};

export default RecipeForm;
