library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        input_signal : in std_logic;
        output_signal : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    output_signal <= input_signal;
end architecture;
