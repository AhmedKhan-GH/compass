library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        sample : in std_logic_vector(7 downto 0);
        signed_sample : in std_logic_vector(7 downto 0);
        doubled : out std_logic_vector(7 downto 0);
        discarded : out std_logic;
        halved : out std_logic_vector(7 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    doubled <= std_logic_vector(shift_left(unsigned(sample),1)); discarded <= sample(7); halved <= std_logic_vector(shift_right(signed(signed_sample),1));
end architecture;
